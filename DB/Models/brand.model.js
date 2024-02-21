import { Schema, model } from "mongoose"


//============================== Create the subcategory schema ==============================//

const brandSchema = new Schema({
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        Image: {
            secure_url: { type: String, required: true },
            public_id: { type: String, required: true, unique: true }
        },
        folderId: { type: String, required: true, unique: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // Admin 
        subCategoryId: { type: Schema.Types.ObjectId, ref: 'subCategory', required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true }
    },
    {
        timestamps: true,
        toJSON : {virtuals : true},
        toObject : {virtuals : true}
    })

    brandSchema.virtual("products" , {
        ref : "Product" ,
        localField : "_id" ,
        foreignField : "brandId"
    })

export default model('Brand', brandSchema)
