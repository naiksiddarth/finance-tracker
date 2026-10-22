import multer from "multer"
import { randomUUID } from "node:crypto"
import { extname } from "node:path"

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads/")
  },
  filename: function (_req, file, cb) {
    const extension = extname(file.originalname)
    cb(null, `${randomUUID()}${extension === "." ? "" : extension}`)
  },
})

const upload = multer({ storage })

export { upload }
