function toTitleCase(str) {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
        return match.toUpperCase();
    });
}    

function cleanWhitespace(str) {
    return str.trim().replace(/\s+/g, " ");
}
