//sort numeric value.
export default (a, b, direction) => {
    let comparison = 0;

    if (a > b) {
        comparison = 1;
    } else if (a < b) {
        comparison = -1;
    }

    return direction === "desc" ? (comparison * -1) : comparison;
};