const errorMiddleware = require('./middlewares/error.middleware')

app.use('/api', routes)

// ✅ ต้องอยู่ล่างสุด
app.use(errorMiddleware)
