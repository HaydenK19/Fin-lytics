# Google Cloud Setup Guide for Fin-lytics

## Step 1: Create Google Cloud Account ✅ (You've Done This!)
1. ~~Go to https://cloud.google.com/~~
2. ~~Click "Get started for free"~~
3. ~~Sign up with Gmail account~~
4. ~~Verify with credit card (won't be charged)~~
5. ~~Get $300 free credit (90 days)~~

## Step 2: Install Google Cloud CLI
### For Windows:
1. **Download installer:** https://cloud.google.com/sdk/docs/install
2. **Run the installer** (GoogleCloudSDKInstaller.exe)
3. **Follow the setup wizard**
4. **Open new PowerShell window** and verify:
   ```powershell
   gcloud --version
   ```

### Alternative (PowerShell):
```powershell
# Install via PowerShell (if above doesn't work)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

## Step 3: Authenticate and Setup Project
### 3a. Login to Google Cloud
```powershell
gcloud auth login
```
This will open your browser - sign in with your Google account.

### 3b. Create a New Project
```powershell
# Create a new project (replace 'finlytics-app-123' with unique name)
gcloud projects create finlytics-app-123 --name="Fin-lytics App"

# Set as default project
gcloud config set project finlytics-app-123
```

### 3c. Enable Required APIs
```powershell
# Enable Compute Engine API
gcloud services enable compute.googleapis.com

# Wait for APIs to be enabled (takes 1-2 minutes)
```

### 3d. Set Default Zone
```powershell
gcloud config set compute/zone us-central1-a
```

## Step 4: Create VM Instance (Easy Method)
### Option A: Use Google Cloud Console (Recommended for First Time)

1. **Go to:** https://console.cloud.google.com/compute/instances
2. **Click "Create Instance"**
3. **Configure:**
   - **Name:** `finlytics-app`
   - **Region:** `us-central1 (Iowa)`
   - **Zone:** `us-central1-a`
   - **Machine type:** `e2-standard-2 (2 vCPU, 8 GB memory)`
   - **Boot disk:** Click "Change"
     - **Operating system:** Ubuntu
     - **Version:** Ubuntu 20.04 LTS
     - **Boot disk type:** Standard persistent disk
     - **Size:** 50 GB
   - **Firewall:** ✅ Allow HTTP traffic, ✅ Allow HTTPS traffic

4. **Click "Advanced options" → "Management" → "Startup script"**
5. **Copy and paste this startup script:**
```bash
#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt-get install -y git

# Clone your repository
cd /home
git clone https://github.com/HaydenK19/Fin-lytics.git app
cd app

# Create basic environment file
cat > .env << EOF
DATABASE_URL=sqlite:///./data/finlytics.db
SECRET_KEY=change-this-in-production-12345
PLAID_CLIENT_ID=sandbox_key
PLAID_SECRET=sandbox_secret  
PLAID_ENV=sandbox
REACT_APP_API_URL=http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google'):8000
EOF

# Start the application
docker-compose up -d

echo "Fin-lytics setup complete!"
```

6. **Click "Create"**

## Step 5: Access Your Application
### 5a. Wait for Setup (5-10 minutes)
Your VM is now being created and the startup script is installing everything.

### 5b. Get Your VM's IP Address
1. **Go to:** https://console.cloud.google.com/compute/instances
2. **Find your `finlytics-app` instance**
3. **Copy the "External IP" address**

### 5c. Access Your App
- **Frontend:** http://YOUR_VM_IP:3000
- **Backend API:** http://YOUR_VM_IP:8000
- **API Documentation:** http://YOUR_VM_IP:8000/docs

### 5d. Check if It's Working
```powershell
# Replace YOUR_VM_IP with your actual IP
curl http://YOUR_VM_IP:8000/health
```

## Step 6: SSH into Your VM (Optional)
### From Google Cloud Console:
1. **Go to:** https://console.cloud.google.com/compute/instances  
2. **Click "SSH" next to your instance**

### From Command Line:
```powershell
gcloud compute ssh finlytics-app
```

## Step 7: Verify AI Model is Running on Google Cloud
### Check AI Model Status:
```bash
# SSH into your VM
gcloud compute ssh finlytics-app

# Check if AI model files exist on the VM
ls -la /home/app/AI_model/

# Check AI model status via API
curl http://localhost:8000/health

# Check Docker containers running on the VM
docker-compose ps

# Check AI model loading in backend logs
docker-compose logs backend | grep -i autogluon
```

### Expected Output:
```bash
# AI model files should be present on VM:
/home/app/AI_model/AutoGluonModels_multi/
/home/app/AI_model/finetune_chronos_bolt_base.py
/home/app/AI_model/predict_next.py

# Health check should show:
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "/app/AI_model",
  "timestamp": "2025-12-07T..."
}
```

## Step 8: Monitor and Manage
### Check Application Status:
```bash
# SSH into your VM, then:
cd /home/app
docker-compose ps
docker-compose logs -f
```

### Stop/Start Application:
```bash
# Stop
docker-compose down

# Start  
docker-compose up -d
```

### Update Application:
```bash
cd /home/app
git pull origin main
docker-compose build
docker-compose up -d
```

## Cost Estimation (from $300 credit):
- **e2-standard-2 (2 vCPU, 8GB):** $0.067/hour = $48.44/month
- **Storage (50GB):** $2/month  
- **Network:** ~$1-5/month
- **Total:** ~$51/month = **5.9 months** of hosting from free credit

## VM Specs:
- **CPU:** 2 vCPU cores
- **RAM:** 8GB (sufficient for AutoGluon)
- **Storage:** 50GB SSD
- **Network:** 1 Gbps
- **OS:** Ubuntu 20.04 LTS

## Access Your App:
- **Frontend:** http://VM_EXTERNAL_IP:3000
- **API:** http://VM_EXTERNAL_IP:8000
- **Get IP:** `gcloud compute instances describe finlytics-app --format='get(networkInterfaces[0].accessConfigs[0].natIP)'`