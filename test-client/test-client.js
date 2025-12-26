const io = require('socket.io-client')

const port = process.env.PORT || 8989
const receiverId = process.argv[2] || 'user-123'
const serverUrl = process.argv[3] || `http://localhost:${port}`

console.log(`Connecting to ${serverUrl} with receiverId: ${receiverId}`)

const socket = io(serverUrl, {
    query: { receiverId },
    transports: ['websocket', 'polling'],
})

socket.on('connect', () => {
    console.log(`✅ Connected to WebSocket server`)
    console.log(`   Socket ID: ${socket.id}`)
    console.log(`   Receiver ID: ${receiverId}`)
    console.log(`\n🎧 Listening for notifications...\n`)
})

socket.on('push', (data) => {
    console.log('📬 Received notification:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n🎧 Listening for more notifications...\n')
})

socket.on('error', (error) => {
    console.error('❌ Error:', error)
})

socket.on('disconnect', (reason) => {
    console.log(`❌ Disconnected: ${reason}`)
    process.exit(0)
})

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message)
    process.exit(1)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Closing connection...')
    socket.disconnect()
    process.exit(0)
})

console.log('\nPress Ctrl+C to disconnect\n')
