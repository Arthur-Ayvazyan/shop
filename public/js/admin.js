import {checkElementExistence, checkParam, goToPreviousPage} from './utils.js';

const buttons = document.querySelectorAll('.deleteBtn');

buttons.forEach(btn => btn.addEventListener('click', deleteProduct));

function deleteProduct() {
    const prodId = this.parentNode.querySelector('[name=productId]').value;
    const csrf = this.parentNode.querySelector('[name=_csrf]').value;
    const productElement = this.closest('article');

    fetch(`/admin/product/${prodId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
        .then(result => {
            return result.json();
        })
        .then(data => {
            console.log(data)
            productElement.remove();

            const isProductRemained = checkElementExistence('article');

            if (!isProductRemained) {
                const currentPage = checkParam('page');
                goToPreviousPage('page', currentPage)
            }
        })
        .catch(err => {
            console.log(err)
        });
}
