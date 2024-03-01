import Cart from "../../../../DB/Models/cart.model.js"
import productModel from "../../../../DB/Models/product.model.js"



export const checkProductAvailbility = (productId , quantity )=> {
    const product = productModel.findOne({_id : productId , stock : {$gte : quantity} })
    return product
} 

export const addCart = async (product , quantity  , userId) => {
    const addedProductToCart = await  Cart.create({
        userId,
        subTotal : product.appliedPrice * quantity,
        products : [
            {
                productId : product._id ,
                quantity,
                basePrice : product.appliedPrice,
                finalPrice : product.appliedPrice * quantity, 
                title : product.title
            }
        ]
    }) 
    return addedProductToCart
}

export const findProductAndUpdate = (products , productId , quantity) => {
    let isEXist = false 
    products.map(item => {
        if(item.productId.toString() === productId) {
            item.quantity = quantity
            item.finalPrice = item.basePrice * quantity
            isEXist = true
        }
    })
    return isEXist
}

export const pushNewProduct = (products , product , quantity)=> {
    products.push(
        {
            productId : product._id,
            quantity,
            basePrice : product.appliedPrice,
            finalPrice : product.appliedPrice * quantity, 
            title : product.title
        }
    )
}

export const calculateSubTotal = (products) => {
    let subtotal = 0
    for (const product of products) {
        subtotal += product.finalPrice 
    }
    return subtotal
}
