#!/bin/bash

# Save your Transloadit auth secret in a variable
# Replace this with your actual secret
export TRANSLOADIT_AUTH_SECRET="17e1f1c3ec86abbac5bef45d41841ba013bce807"

# Create temporary JSON payload file
cat << 'EOF' > /tmp/test-notification.json
{
  "assembly_id": "5fc3c5b47de44336996ff5480c3052a1",
  "ok": "ASSEMBLY_COMPLETED",
  "assembly_url": "https://api2.transloadit.com/assemblies/5fc3c5b47de44336996ff5480c3052a1",
  "results": {
    "store_original": [
      {
        "url": "https://wasabi.example/uploads/original/test_abc123.jpg",
        "name": "test.jpg",
        "type": "image/jpeg"
      }
    ],
    "store_thumbnail": [
      {
        "url": "https://wasabi.example/uploads/thumbnails/test_abc123_thumb.jpg",
        "name": "test_thumb.jpg",
        "type": "image/jpeg"
      }
    ]
  },
  "uploads": [
    {
      "name": "test.jpg",
      "type": "image/jpeg",
      "size": 12345
    }
  ]
}
EOF

# Calculate signature using Node.js
SIGNATURE=$(node -e "
const crypto = require('crypto');
const fs = require('fs');
const payload = fs.readFileSync('/tmp/test-notification.json', 'utf8');
const signature = crypto
  .createHmac('sha1', process.env.TRANSLOADIT_AUTH_SECRET)
  .update(Buffer.from(payload, 'utf8'))
  .digest('hex');
console.log(signature);
")

# Send request using curl
curl -X POST "https://ee6f-161-29-13-173.ngrok-free.app/assembly-status" \
  -H "Content-Type: application/json" \
  -H "Transloadit-Signature: $SIGNATURE" \
  -d @/tmp/test-notification.json

# Clean up
rm /tmp/test-notification.json