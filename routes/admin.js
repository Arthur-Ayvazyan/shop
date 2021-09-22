const path = require('path');

const express = require('express');

const {check, body} = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.post(
    '/add-product',
    isAuth,
    [
        body('title')
            .isAlphanumeric()
            .isLength({min: 2})
            .withMessage('enter at least 2 characters')
            .trim()
        ,
        // body('imageUrl')
        //     .trim()
        //     .notEmpty()
        //     .isURL()
        //     .withMessage('you should add real URL'),
        body('price')
            .isFloat()
            .withMessage('price should contain only numbers'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('description is empty'),
    ],
    adminController.postAddProduct
);
// /admin/add-product => POST

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
    '/edit-product',
    isAuth,
    [
        body('title')
            .isAlphanumeric()
            .isLength({min: 2})
            .withMessage('enter at least 2 characters')
            .trim()
        ,
/*        body('imageUrl')
            .trim()
            .notEmpty()
            .isURL()
            .withMessage('you should add real URL'),*/
        body('price')
            .isFloat()
            .withMessage('price should contain only numbers'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('description is empty'),
    ],
    adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
