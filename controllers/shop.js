const path = require('path');

const fs = require('fs');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');

const Order = require('../models/order');

const {handleError} = require("../error/error");

const ITEMS_PER_PAGE = 1;

let paginationData;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product
        .find()
        .countDocuments()
        .then(countOfProducts => {
            totalItems = countOfProducts
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
                paginationData: {
                    currentPage: page,
                    totalProducts: totalItems,
                    hesNextPage: (ITEMS_PER_PAGE * page) < totalItems,
                    hesPreviousPage: page > 1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
                }
            });
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products'
            });
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product
        .find()
        .countDocuments()
        .then(countOfProducts => {
            totalItems = countOfProducts
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                paginationData: {
                    currentPage: page,
                    totalProducts: totalItems,
                    hesNextPage: (ITEMS_PER_PAGE * page) < totalItems,
                    hesPreviousPage: page > 1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
                }
            });
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log(result);
            res.redirect('/cart');
        });
};

exports.postCartDeleteProduct = (req, res, next) => {

    const prodId = req.body.productId;
    req.user
        .removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getCheckout = (req, res, next) => {

    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            let total = 0;
            products.forEach(product => {
                total += product.quantity * product.productId.price;
            })
            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total
            });
        })
        .catch(err => {
            handleError(err, 500, next);
        });

}

exports.postOrder = (req, res, next) => {

    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}};
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getOrders = (req, res, next) => {

    Order.find({'user.userId': req.user._id})
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getInvoice = (req, res, next) => {

    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then(order => {

            if (!order) {
                return next(new Error(`No order found.`))
            }

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error(`Unauthorized!`))
            }

            const invoiceName = `invoice-${orderId}.pdf`;
            const invoicePath = path.join('data', 'invoices', invoiceName);
            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '" '
            );

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });

            pdfDoc.text('-------------------------')

            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc
                    .fontSize(14)
                    .text(`${prod.product.title}-${prod.quantity}x $${prod.product.price}`);
            })

            pdfDoc.text('----')
            pdfDoc
                .fontSize(18)
                .text(`Total Price $${totalPrice}`);

            pdfDoc.end();
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);
        })
        .catch(err => next(err))
}