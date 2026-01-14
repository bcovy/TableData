export default (a, b, direction) => {
    let comparison = 0;
    let dateA = new Date(a);
    let dateB = new Date(b);

    if (Number.isNaN(dateA.valueOf())) {
        dateA = null;
    }

    if (Number.isNaN(dateB.valueOf())) {
        dateB = null;
    }
    //both dates are null/invalid
    if (dateA === null && dateB === null) {
        return 0;
    }
    //handle empty values.
    if (!dateA) {
        comparison = !dateB ? 0 : -1;
    } else if (!dateB) {
        comparison = 1;
    } else if (dateA > dateB) {    
        comparison = 1;
    } else if (dateA < dateB) {
        comparison = -1;
    }

    return direction === "desc" ? (comparison * -1) : comparison;
};