const path = require('path');
const mongoose = require('mongoose');
const fileHelper = require('../util/file');
const Product = require('../models/product');

const {validationResult} = require('express-validator/check');
const {response} = require("express");
const {handleError} = require("../error/error");

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hesError: false,
        validationErrors: {}
    });
};

exports.postAddProduct = (req, res, next) => {

    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    if (!image) {
        return res
            .status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                hesError: true,
                product: {
                    title,
                    price,
                    description,
                },
                validationErrors: {
                    image: 'Not allowed file !!!'
                }

            });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        const validationErrors = {};
        errors.array().forEach(({param, msg}) => validationErrors[param] = msg);
        return res
            .status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                hesError: true,
                product: {...req.body, _id: req.body.productId},
                validationErrors
            });
    }

    const imageUrl = image.filename;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
    });

    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        });
};

exports.getEditProduct = (req, res, next) => {

    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                validationErrors: {}
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        });
};

exports.postEditProduct = (req, res, next) => {

    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        const validationErrors = {};
        errors.array().forEach(({param, msg}) => validationErrors[param] = msg);
        return res
            .status(422)
            .render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: true,
                hesError: true,
                product: {
                    title: updatedTitle,
                    price: updatedPrice,
                    description: updatedDesc,
                    _id: prodId
                },
                validationErrors
            });
    }

    Product.findById(prodId)
        .then(product => {

            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;

            if (image) {
                const deletableFilePath = path.resolve('images', product.imageUrl);
                fileHelper.deleteFile(deletableFilePath)
                product.imageUrl = image.filename;
            }

            return product.save();
        })
        .then(result => {
            console.log('UPDATED PRODUCT!');
            res.redirect('/admin/products');
        })
        .catch(err => {
            handleError(err, 500, next);
        });
};

exports.getProducts = (req, res, next) => {

    const page = +req.query.page || 1;
    let totalItems;
    Product
        .find({userId: req.user._id})
        .countDocuments()
        .then(countOfProducts => {
            totalItems = countOfProducts
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
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

exports.deleteProduct = (req, res, next) => {

    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {

            if (!product) {
                return next(new Error('Product not found!'))
            }

            const deletableFilePath = path.resolve('images', product.imageUrl);
            console.log(deletableFilePath)
            fileHelper.deleteFile(deletableFilePath);
            return Product.deleteOne({_id: prodId, userId: req.user._id});
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.status(200).json({
                message: 'Success!'
            });
        })
        .catch(err => {
            res.status(500).json({
                message: 'Deleting product failed.'
            })
        });
};
