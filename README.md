# Uppy Transloadit NoUX

This project illustrates how to upload files using Uppy:
- this example shows how to use Uppy without the Dashboard UX for situations where you want to integrate Uppy with an existing app or using your own UI
- uploads go to Transloadit, which can save your files on to storage of your choice, the example is configured for Wasabi
- supports multi-part resumable uploads with signing implemented on backend using NodeJS/Express
- illustrates how to upload images pasted from clipboard to a content editable field

Contributions and feedback most welcome, please upload as a pull request or add comments/questions in issues.

You'll need to create a .env file
```
TRANSLOADIT_AUTH_KEY=YOURAUTHKEY
TRANSLOADIT_AUTH_SECRET=YOURAUTHSECRET
EXTERNAL_URL=YOURSERVERIPADDRESS
PORT=3000
```

## Local development
If you are testing in a local development environment set the external url to your externally accessible address - this is where Transloadit will deliver notifications when your assembly is processed.  
If you need to you can use a service like ngrok (e.g. using a command like ngrok http 3000) to get a temporary url for testing purposes. Update the .env EXTERNAL_URL value to match.

## Transloadit.com configuration
You'll need an account on Transloadit.com.
Once setup you must to go credentials > 3rd party credentials and setup API keys for the service you are using.  This example is configured for Wasabi but you can easily change to a different service (see below).  
When setting up the credentials you'll be prompted for values such as region, bucketname and API key and secret.  Transloadit will use these to save you files to storage.
The other thing  that is essential is setting up your assembly.  This tells transloadit how to save your files. I have provided an example at example_assembly.json that you can use.  Be sure to adjust the fields to the values you want to use.
Note that this template is setup to have Transloadit save files to wasabi, if you want to save somewhere else (e.g. Amazon S3) checkout the other available robots and change to the one you want.

```
  "robot": "/wasabi/store",
```

Bucket/region fields you should update
```
 "fields": {
      "path": "uploads",
      "bucket": "syd-ob3uploads-2024",
      "region": "ap-southeast-2"
    }
```

And finally checkout our app if you have made it this far: www.ob3.io
