#!/usr/bin/env python3
"""
Oracle Cloud Always Free Instance Creator
Automatically retries creating VM.Standard.A1.Flex instances across all regions and availability domains.
Run this script to keep trying until you get a free ARM instance.
"""

import time
import json
import subprocess
import sys
from datetime import datetime

# Oracle Cloud configuration
CONFIG = {
    "compartment_id": "YOUR_COMPARTMENT_ID",  # Replace with your compartment OCID
    "availability_domains": ["AD-1", "AD-2", "AD-3"],
    "regions": [
        "us-ashburn-1", "us-phoenix-1", 
        "uk-london-1", "eu-frankfurt-1", "eu-amsterdam-1",
        "ap-tokyo-1", "ap-seoul-1", "ap-mumbai-1",
        "ca-toronto-1", "ap-sydney-1", "sa-saopaulo-1"
    ],
    "shape": "VM.Standard.A1.Flex",
    "shape_config": {
        "ocpus": 4,
        "memory_in_gbs": 24
    },
    "image_id": "ocid1.image.oc1.iad.aaaaaaaaba4bexplcot4py37n3ym5km5mvdcty72pgxikjz74zivr7k37fxq",  # Ubuntu 22.04 ARM
    "subnet_id": "YOUR_SUBNET_ID",  # Replace with your subnet OCID
    "ssh_public_key_file": "~/.ssh/id_rsa.pub",  # Path to your SSH public key
    "display_name": "finlytics-free-instance"
}

def log(message):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def run_oci_command(cmd):
    """Run OCI CLI command and return result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            return True, result.stdout
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

def read_ssh_key():
    """Read SSH public key"""
    import os
    key_path = os.path.expanduser(CONFIG["ssh_public_key_file"])
    try:
        with open(key_path, 'r') as f:
            return f.read().strip()
    except Exception as e:
        log(f"Error reading SSH key from {key_path}: {e}")
        return None

def create_instance(region, availability_domain):
    """Try to create instance in specific region and AD"""
    ssh_key = read_ssh_key()
    if not ssh_key:
        log("Failed to read SSH public key!")
        return False
    
    # Switch to region
    log(f"Switching to region: {region}")
    success, _ = run_oci_command(f"oci setup config --region {region}")
    if not success:
        log(f"Failed to switch to region {region}")
        return False
    
    # Create instance command
    cmd = f"""
    oci compute instance launch \\
        --compartment-id {CONFIG['compartment_id']} \\
        --availability-domain {region}:{availability_domain} \\
        --shape {CONFIG['shape']} \\
        --shape-config '{{"ocpus":{CONFIG['shape_config']['ocpus']},"memoryInGBs":{CONFIG['shape_config']['memory_in_gbs']}}}' \\
        --image-id {CONFIG['image_id']} \\
        --subnet-id {CONFIG['subnet_id']} \\
        --ssh-authorized-keys-file {CONFIG['ssh_public_key_file']} \\
        --display-name {CONFIG['display_name']} \\
        --wait-for-state RUNNING \\
        --max-wait-seconds 300
    """
    
    log(f"Attempting to create instance in {region}:{availability_domain}")
    success, output = run_oci_command(cmd)
    
    if success:
        log(f"✅ SUCCESS! Instance created in {region}:{availability_domain}")
        log("Instance details:")
        log(output)
        return True
    else:
        if "Out of capacity" in output:
            log(f"❌ Out of capacity in {region}:{availability_domain}")
        else:
            log(f"❌ Failed to create instance in {region}:{availability_domain}")
            log(f"Error: {output}")
        return False

def main():
    """Main retry loop"""
    log("Oracle Cloud Always Free Instance Creator Started")
    log(f"Target shape: {CONFIG['shape']} ({CONFIG['shape_config']['ocpus']} OCPUs, {CONFIG['shape_config']['memory_in_gbs']}GB RAM)")
    
    # Validate OCI CLI
    success, _ = run_oci_command("oci --version")
    if not success:
        log("❌ OCI CLI not found! Please install it first: https://docs.oracle.com/en-us/iaas/tools/oci-cli/3.0.0/")
        sys.exit(1)
    
    attempt = 1
    while True:
        log(f"\n--- Attempt #{attempt} ---")
        
        # Try all regions and availability domains
        for region in CONFIG["regions"]:
            for ad in CONFIG["availability_domains"]:
                if create_instance(region, ad):
                    log("\n🎉 SUCCESS! Instance created successfully!")
                    log("Next steps:")
                    log("1. SSH into your instance")
                    log("2. Run: wget https://raw.githubusercontent.com/HaydenK19/Fin-lytics/main/oracle_setup.sh")
                    log("3. Run: chmod +x oracle_setup.sh && ./oracle_setup.sh")
                    return
                
                # Small delay between attempts
                time.sleep(2)
        
        # Wait before next full retry cycle
        wait_time = min(60 * attempt, 300)  # Exponential backoff, max 5 minutes
        log(f"All regions/ADs failed. Waiting {wait_time} seconds before retry...")
        time.sleep(wait_time)
        attempt += 1

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\n⏹️  Script stopped by user")
    except Exception as e:
        log(f"❌ Unexpected error: {e}")