# Oracle Cloud Setup Instructions

## Prerequisites
1. **Create Oracle Cloud Account:**
   - Go to https://www.oracle.com/cloud/free/
   - Sign up for Always Free account
   - Verify with credit card (won't be charged)

2. **Install OCI CLI:**
   ```bash
   # Windows (PowerShell as Admin)
   Set-ExecutionPolicy RemoteSigned
   Invoke-WebRequest -Uri https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1 -OutFile install.ps1
   .\install.ps1
   
   # Or download from: https://docs.oracle.com/en-us/iaas/tools/oci-cli/3.0.0/
   ```

3. **Configure OCI CLI:**
   ```bash
   oci setup config
   # Follow prompts to set up authentication
   ```

4. **Generate SSH Key Pair:**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   # Press Enter for all prompts (no passphrase needed)
   ```

## Setup Configuration

### Find Your OCIDs:
1. **Compartment OCID:** 
   - Go to Identity > Compartments in Oracle Cloud Console
   - Click on root compartment, copy OCID

2. **Subnet OCID:**
   - Go to Networking > Virtual Cloud Networks
   - Create/select a VCN
   - Create/select a public subnet, copy OCID

### Update oracle_retry.py:
```python
CONFIG = {
    "compartment_id": "ocid1.compartment.oc1..aaaaa...",  # Your compartment OCID
    "subnet_id": "ocid1.subnet.oc1.iad.aaaaa...",          # Your subnet OCID
    # ... rest stays the same
}
```

## Running the Retry Script

### Method 1: Python Script (Recommended)
```bash
# Make sure you have Python 3.6+
python oracle_retry.py
```

### Method 2: PowerShell Loop (Windows Alternative)
```powershell
# Save as oracle_retry.ps1
$regions = @("us-ashburn-1", "us-phoenix-1", "uk-london-1", "eu-frankfurt-1")
$ads = @("AD-1", "AD-2", "AD-3")

while ($true) {
    foreach ($region in $regions) {
        oci setup config --region $region
        foreach ($ad in $ads) {
            Write-Host "Trying $region : $ad"
            
            $result = oci compute instance launch `
                --compartment-id "YOUR_COMPARTMENT_ID" `
                --availability-domain "$region:$ad" `
                --shape "VM.Standard.A1.Flex" `
                --shape-config '{"ocpus":4,"memoryInGBs":24}' `
                --image-id "ocid1.image.oc1.iad.aaaaaaaaba4bexplcot4py37n3ym5km5mvdcty72pgxikjz74zivr7k37fxq" `
                --subnet-id "YOUR_SUBNET_ID" `
                --ssh-authorized-keys-file "~/.ssh/id_rsa.pub" `
                --display-name "finlytics-free" `
                2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS! Instance created in $region : $ad"
                exit 0
            }
            
            Start-Sleep -Seconds 3
        }
    }
    
    Write-Host "All regions failed, waiting 60 seconds..."
    Start-Sleep -Seconds 60
}
```

## What the Script Does:
1. **Tries all regions:** US, Europe, Asia-Pacific, etc.
2. **Tries all availability domains:** AD-1, AD-2, AD-3
3. **Automatically retries:** Until it finds available capacity
4. **Exponential backoff:** Waits longer between retries
5. **Creates ARM instance:** 4 CPU, 24GB RAM (Always Free)

## Success Indicators:
- ✅ "Instance created successfully"
- ✅ You'll get instance OCID and IP address
- ✅ SSH access will be available

## Tips:
- **Run overnight:** ARM capacity often becomes available during off-peak hours
- **Try weekends:** Less competition for free instances  
- **Multiple terminals:** Run script in multiple regions simultaneously
- **Persistence:** Some users report success after days/weeks of trying

## Alternative Regions to Try:
If popular regions fail, try these less crowded ones:
- `ca-montreal-1` (Canada)
- `sa-saopaulo-1` (Brazil) 
- `ap-melbourne-1` (Australia)
- `eu-marseille-1` (France)

## Once You Get an Instance:
1. SSH into it: `ssh -i ~/.ssh/id_rsa ubuntu@YOUR_INSTANCE_IP`
2. Run the Oracle setup script to install your app
3. Enjoy free hosting for life! 🎉