export default (a, b, direction) => {
    let comparison = 0;
    //handle empty values.
    if (!a) {
        comparison = !b ? 0 : -1;
    } else if (!b) {
        comparison = 1;
    } else {
        const varA = a.toUpperCase();
        const varB = b.toUpperCase();
    
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
    }

    return direction === "desc" ? (comparison * -1) : comparison;
};