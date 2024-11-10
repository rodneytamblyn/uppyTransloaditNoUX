const express = require('express')
const crypto = require('crypto')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '../frontend')))

const TRANSLOADIT_AUTH_KEY = process.env.TRANSLOADIT_AUTH_KEY
const TRANSLOADIT_AUTH_SECRET = process.env.TRANSLOADIT_AUTH_SECRET
const EXTERNAL_URL = process.env.EXTERNAL_URL || 'https://ee6f-161-29-13-173.ngrok-free.app'

app.post('/transloadit-signature', (req, res) => {
    const utcDateString = (ms) => {
        return new Date(ms)
            .toISOString()
            .replace(/-/g, '/')
            .replace(/T/, ' ')
            .replace(/\.\d+Z$/, '+00:00')
    }

    const expires = utcDateString(Date.now() + 1 * 60 * 60 * 1000)
    
    const params = {
        auth: { 
            key: TRANSLOADIT_AUTH_KEY,
            expires
        },
        template_id: 'ob3-wasabi-2024',
        notify_url: `${EXTERNAL_URL}/assembly-status`,
        notify_logs: true
    }

    const signature = crypto
        .createHmac('sha384', TRANSLOADIT_AUTH_SECRET)
        .update(Buffer.from(JSON.stringify(params), 'utf-8'))
        .digest('hex')

    console.log('Generated new upload params with signature')
    res.json({
        signature: `sha384:${signature}`,
        params
    })
})

app.post('/assembly-status', (req, res) => {
    const receivedSignature = req.body.signature
    const transloaditData = req.body.transloadit
    
    if (!transloaditData) {
        console.error('❌ Error: No transloadit data received')
        return res.status(400).json({ error: 'No transloadit data' })
    }

    const expectedSignature = crypto
        .createHmac('sha1', TRANSLOADIT_AUTH_SECRET)
        .update(Buffer.from(transloaditData, 'utf-8'))
        .digest('hex')

    if (receivedSignature !== expectedSignature) {
        console.error('❌ Signature verification failed:')
        console.error('Received:', receivedSignature)
        console.error('Expected:', expectedSignature)
        return res.status(403).json({ error: 'Invalid signature' })
    }

    const assembly = JSON.parse(transloaditData)
    
    console.log(`\n=== Assembly Status Update ===`)
    console.log(`🔄 Assembly: ${assembly.assembly_id}`)
    console.log(`📍 Status: ${assembly.ok}`)
    console.log(`🌐 URL: ${assembly.assembly_ssl_url || assembly.assembly_url}`)

    // Log timings
    console.log('\n⏱️ Timing Information:')
    console.log(`Start: ${assembly.start_date}`)
    if (assembly.execution_start) console.log(`Execution Start: ${assembly.execution_start}`)
    if (assembly.upload_duration) console.log(`Upload Duration: ${assembly.upload_duration.toFixed(2)}s`)
    if (assembly.execution_duration) console.log(`Processing Duration: ${assembly.execution_duration.toFixed(2)}s`)

    // Log TUS upload details
    console.log('\n📤 Upload Information:')
    console.log(`Expected TUS uploads: ${assembly.expected_tus_uploads || 0}`)
    console.log(`Started TUS uploads: ${assembly.started_tus_uploads || 0}`)
    console.log(`Finished TUS uploads: ${assembly.finished_tus_uploads || 0}`)
    if (assembly.bytes_expected) {
        const progressPct = ((assembly.bytes_received / assembly.bytes_expected) * 100).toFixed(1)
        console.log(`Progress: ${progressPct}% (${assembly.bytes_received}/${assembly.bytes_expected} bytes)`)
    }

    // Log any errors or messages
    if (assembly.message) {
        console.log(`\n💬 Message: ${assembly.message}`)
    }
    if (assembly.error) {
        console.error('\n❌ Error:', assembly.error)
    }

    // Log file details
    if (assembly.uploads && assembly.uploads.length > 0) {
        console.log('\n📁 Uploaded Files:')
        assembly.uploads.forEach(file => {
            console.log(`- ${file.name} (${file.type}, ${(file.size/1024).toFixed(1)}KB)`)
        })
    }

    // Log processing results
    if (assembly.results && Object.keys(assembly.results).length > 0) {
        console.log('\n✅ Processing Results:')
        Object.entries(assembly.results).forEach(([step, files]) => {
            console.log(`\n${step}:`)
            files.forEach(file => {
                console.log(`- ${file.name || file.basename} (${file.mime || file.type})`)
                if (file.url) console.log(`  URL: ${file.url}`)
                if (file.meta) console.log(`  Meta:`, file.meta)
            })
        })
    }

    if (!assembly.uploads?.length && !Object.keys(assembly.results || {}).length) {
        console.log('\nℹ️ No files or results in this update')
    }

    res.json({ success: true })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})