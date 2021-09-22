export const checkElementExistence = (element) => {
    return document.querySelector(element);
}

export const checkParam = (param) => new URL(window.location.href).searchParams.get(param)

export const goToPreviousPage = (param, value) => {

    if(!value || value <= 2) {
        window.location.replace(window.location.href.split('?')[0])
    }

    if(value > 2) {
        const newPage = (value - 1) + '';
        const newHref = new URL(window.location.href);
        newHref.searchParams.set(param, newPage);
        window.location.replace(newHref)
    }
}