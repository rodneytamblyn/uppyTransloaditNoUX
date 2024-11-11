# Uppy Transloadit NoUX

This project illustrates how to upload files using Uppy:
- this example shows how to use Uppy using either your own UX, or using the Uppy Dashboard UX
- the demo allows you to add files via either UX, and pause and resume.  The same Uppy instance and queue of files is used - you can use interchangeably
- uploads go to Transloadit, which can save your files on to storage of your choice, the example is configured for Wasabi
- supports multi-part resumable uploads with signing implemented on backend using NodeJS/Express
- illustrates how to upload images pasted from clipboard to a content editable field

Contributions and feedback most welcome, please upload as a pull request or add comments/questions in issues.

You'll need to create a .env file
```
TRANSLOADIT_AUTH_KEY=YOURAUTHKEY
TRANSLOADIT_AUTH_SECRET=YOURAUTHSECRET
TRANSLOADITTEMPLATEID=YOURTRANSLOADIT_TEMPLATE_ID
EXTERNAL_URL=YOUR_SERVER_PUBLIC_ACCESSIBLE_URL
REGION=YOURBUCKETREGION
STORAGEPATH=
PORT=3000
```

Note: as we are using transloadit, the rest of your storage settings are defined in your transloadit assembly, and using transloadit 3rd party credentials for accessing your S3 storage provider account.

Storage path is optional (example 'uploads')

## Local development
If you are testing in a local development environment set the external url to your externally accessible address - this is where Transloadit will deliver notifications when your assembly is processed.  
If you need to you can use a service like ngrok (e.g. using a command like ngrok http 3000) to get a temporary url for testing purposes. Update the .env EXTERNAL_URL value to match.

## Transloadit.com configuration
You'll need an account on Transloadit.com.
Once setup you must to go credentials > 3rd party credentials and setup API keys for the service you are using.  This example is configured for Wasabi but you can easily change to a different service (see below).  Make a note of the name you give - you'll need this!

When setting up the credentials you'll be prompted for values such as region, bucketname and API key and secret.  Transloadit will use these to save you files to storage.
The other thing  that is essential is setting up your assembly.  This tells transloadit how to save your files. 

I have provided an example at example_assembly.json that you can use.  Be sure to adjust the fields to the values you want to use.  You can also just use one of the default template examples provided by transloadit as some of the settings here might not match your needs.

Note that this template is setup to have Transloadit save files to wasabi, if you want to save somewhere else (e.g. Amazon S3) checkout the other available robots and change to the one you want.

```
  "robot": "/wasabi/store",
```

You should also change the template credentials (multiple occurances in file) to match the name you give to the 3rd
party credentials you create in Transloadit.

```
  "credentials": "MYCREDENTIALNAME"
```

Update the template ID to whatever you would like to use
```
 "template_id": "MYTEMPLATEID",
```

Bucket/region fields you should update
```
 "fields": {
      "path": "uploads",
      "bucket": "YOURBUCKETNAME",
      "region": "YOURBUCKETREGION e.g. ap-southeast-2"
    }
```

And finally checkout our app if you have made it this far: www.ob3.io
