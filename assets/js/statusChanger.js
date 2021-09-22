
function statusChanger(status, type){
    const statuses = {
        ქომაგი: "supporter",
        ახლობელი: "relative",
        ნარკომომხმარებელი: "drug user",
        ექიმი: "doctor",
        პაციენტი: "patient",
        სამართალდამცავი: "law enforcement"
      }

    if(type === 'class'){
        return statuses[status.replace(" ", "_")].replace(" ", "")
    } else if (type === 'lang') {
        return statuses[status.replace(" ", "_")]
    } else {
        return status.replace('_', ' ')
    }
}

export default statusChanger