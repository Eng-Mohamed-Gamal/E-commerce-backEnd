import Cart from "../../../DB/Models/cart.model.js"
import { addCart, calculateSubTotal, checkProductAvailbility, findProductAndUpdate, pushNewProduct } from "./utils/enhance.js"

//========================================addToCart================================//

export const addToCart = async (req , res , next) => {
    const {_id : userId} = req.authUser
    const {productId , quantity} = req.query
    // product availbility
    const product = await checkProductAvailbility(productId , quantity)
    if(!product) return next({message : "Product Not Found Or Out Of Stock"})
    // cart Check
    const cart = await Cart.findOne({userId})
    if(!cart){
        const cart = await addCart(product , quantity , userId) 
        return res.status(201).json({message : "Product Add Done" , cart})
    }
    // find Product And Update
    const isExist = findProductAndUpdate(cart.products , productId , quantity)
    if(!isExist){
        // push new product
        pushNewProduct(cart.products , product , quantity)
    }
    // calculate subTotal 
    cart.subTotal = calculateSubTotal(cart.products)
    // save changes
    const updatedCart = await cart.save()
    return res.status(200).json({message : "Update Cart Done" , updatedCart})

}

//============================= remove product from cart ===================================//


export const removeFromcart = async (req, res, next) => {
    const { productId } = req.params
    const { _id } = req.authUser
    // check if product is in cart.products
    const cart = await Cart.findOne({ userId: _id, 'products.productId': productId })
    if (!cart) return next({ message: 'Product not found in cart', cause: 404 })
    // update products arr
    cart.products = cart.products.filter(product => product.productId.toString() !== productId)
    // calculate SubTotal
    cart.subTotal = calculateSubTotal(cart.products)
    // save changes
    const newCart = await cart.save()
    // delete cart if there is no products
    if (newCart.products.length === 0) await Cart.findByIdAndDelete(newCart._id)
    res.status(200).json({ message: 'Product delete to from cart successfully' })
}

export const getCart = async (req, res) => {
    // destruct data from the user
    const { _id } = req.authUser
    // check that cart is found
    const userCart = await Cart.findOne({ userId: _id })
    if (!userCart) return res.status(404).json({ msg: "Cart not found" })
    // send response
    res.status(200).json({ msg: "Cart fetched successfully", data: userCart })
}






