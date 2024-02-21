

export const handlePagination = ({page = 1 , size = 2}) => {
    if(+page <= 0  ) page = 1
    if(+size <= 0  ) size = 2

    const limit = +size
    const skip = (+page -1) * limit

    return {limit , skip}
}