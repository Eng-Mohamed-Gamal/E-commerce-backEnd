
export const rollbackSavedDocuments = async (req, res, next) => {

    /**
     * @description delete the saved documents from the database if the request failed
     * @param {object} { model ,_id}  - the saved documents
     */
    console.log('rollbackSavedDocuments middleware');
    if (req.savedDocuments) {
        console.log(req.savedDocuments)
        const { model, _id } = req.savedDocuments
        await model.findByIdAndDelete(_id)
    }
}