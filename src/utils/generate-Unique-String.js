


import { customAlphabet } from 'nanoid'

const generateUniqueString = ( fields , length) => {

    const nanoid = customAlphabet( fields  || '12345asdfgh', length || 10)
    return nanoid()
}


export default generateUniqueString