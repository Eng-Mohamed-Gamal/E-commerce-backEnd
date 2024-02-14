import slugify from "slugify"

import Brand from "../../../DB/Models/brand.model.js"
import Product from "../../../DB/Models/product.model.js"
import { systemRoles } from "../../utils/system-roles.js"
import cloudinaryConnection from "../../utils/cloudinary.js"
import generateUniqueString from "../../utils/generate-Unique-String.js"





//================================= Add product API =================================//
export const addProduct = async (req, res, next) => {
    // data from the request body
    const { title, desc, basePrice, discount, stock, specs } = req.body
    // data from the request query
    const { categoryId, subCategoryId, brandId } = req.query
    // data from the request authUser
    const addedBy = req.authUser._id

    // brand check 
    const brand = await Brand.findById(brandId)
    if (!brand) return next({ cause: 404, message: 'Brand not found' })

    // category check
    if (brand.categoryId.toString() !== categoryId) return next({ cause: 400, message: 'Brand not found in this category' })
    // sub-category check
    if (brand.subCategoryId.toString() !== subCategoryId) return next({ cause: 400, message: 'Brand not found in this sub-category' })

    // who will be authorized to add a product
    if (
        req.authUser.role !== systemRoles.SUPER_ADMIN &&
        brand.addedBy.toString() !== addedBy.toString()
    ) return next({ cause: 403, message: 'You are not authorized to add a product to this brand' })

    // generate the product  slug
    const slug = slugify(title, { lower: true, replacement: '-' })  //  lowercase: true

    //  applied price calculations
    const appliedPrice = basePrice - (basePrice * (discount || 0) / 100) 


    //Images
    if (!req.files?.length) return next({ cause: 400, message: 'Images are required' })
    const Images = []
    const folderId = generateUniqueString( "12345678asdfgh"  , 4 )
    const folderPath = brand.Image.public_id.split(`${brand.folderId}/`)[0]

    for (const file of req.files) {
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(file.path, {
            folder: folderPath + `${brand.folderId}/Products/${folderId}`
        })
        Images.push({ secure_url, public_id })
    }
    req.folder = folderPath + `${brand.folderId}/Products/${folderId}`


    // prepare the product object for db 
    const product = {
        title, desc, slug, basePrice, discount, appliedPrice, stock, specs: JSON.parse(specs), categoryId, subCategoryId, brandId, addedBy, Images, folderId
    }

    const newProduct = await Product.create(product)
    req.savedDocuments = { model: Product, _id: newProduct._id }

    res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct })
}


//================================================= Update product API ============================================//
export const updateProduct = async (req, res, next) => {
    // data from the request body
    const { title, desc, specs, stock, basePrice, discount, oldPublicId } = req.body
    // data for condition
    const { productId } = req.params
    // data from the request authUser
    const addedBy = req.authUser._id


    // prodcuct Id  
    const product = await Product.findById(productId)
    if (!product) return next({ cause: 404, message: 'Product not found' })

    // who will be authorized to update a product
    if (
        req.authUser.role !== systemRoles.SUPER_ADMIN &&
        product.addedBy.toString() !== addedBy.toString()
    ) return next({ cause: 403, message: 'You are not authorized to update this product' })

    // title update
    if (title) {
        product.title = title
        product.slug = slugify(title, { lower: true, replacement: '-' })
    }
    if (desc) product.desc = desc
    if (specs) product.specs = JSON.parse(specs)
    if (stock) product.stock = stock

    // prices changes 
    const appliedPrice = (basePrice || product.basePrice) * (1 - ((discount || product.discount) / 100))
    product.appliedPrice = appliedPrice

    if (basePrice) product.basePrice = basePrice
    if (discount) product.discount = discount


    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Please select new image' })

        const folderPath = product.Images[0].public_id.split(`${product.folderId}/`)[0]
        const newPublicId = oldPublicId.split(`${product.folderId}/`)[1]

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: folderPath + `${product.folderId}`,
            public_id: newPublicId 
        })
        product.Images.map((img) => {
            if (img.public_id === oldPublicId) {
                img.secure_url = secure_url
            }
        })
        req.folder = folderPath + `${product.folderId}`
    }


    await product.save()

    res.status(200).json({ success: true, message: 'Product updated successfully', data: product })
}