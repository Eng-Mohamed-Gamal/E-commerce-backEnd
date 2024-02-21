import { Router } from 'express'
import expressAsyncHandler from 'express-async-handler'

import * as Pc from './product.controller.js'
import { auth } from '../../middlewares/auth.middleware.js'
import { multerMiddleHost } from '../../middlewares/multer.js'
import { allowedExtensions } from '../../utils/allowed-extensions.js'
import { systemRoles } from '../../utils/system-roles.js'

const router = Router()



router.post('/',
    auth([systemRoles.ADMIN , systemRoles.SUPER_ADMIN]),
    multerMiddleHost({ extensions: allowedExtensions.image }).array('image', 3),
    expressAsyncHandler(Pc.addProduct)
)


router.put('/:productId',
    auth([systemRoles.SUPER_ADMIN , systemRoles.ADMIN]),
    multerMiddleHost({ extensions: allowedExtensions.image }).single('image'),
    expressAsyncHandler(Pc.updateProduct)
)
router.delete("/" ,auth([systemRoles.SUPER_ADMIN , systemRoles.ADMIN])  ,expressAsyncHandler(Pc.deleteProduct))

router.get("/" , expressAsyncHandler(Pc.getProducts))
router.get("/getProductById" , expressAsyncHandler(Pc.getProductById))
router.get("/getProductsForTwoSpecificBrands" , expressAsyncHandler(Pc.getProductsForTwoSpecificBrands))
router.get("/searchOnProductWithAnyField" , expressAsyncHandler(Pc.searchOnProductWithAnyField))



export default router
