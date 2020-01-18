import React, { Component } from 'react';
import Header from '../../common/header/Header';
import { Typography, CardContent, Button, withStyles, CardHeader } from '@material-ui/core';
import { FontAwesomeIcon } from '../../assets/fortawesome/react-fontawesome';
import { faStar, faRupeeSign, faCircle, faMinus, faPlus } from '../../assets/fortawesome/free-solid-svg-icons';
import Divider from '@material-ui/core/Divider';
import Box from '@material-ui/core/Box';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import Badge from '@material-ui/core/Badge';
import Card from '@material-ui/core/Card';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import Snackbar from '@material-ui/core/Snackbar';
import Avatar from '@material-ui/core/Avatar';
import './Details.css';

const styles = (theme => ({
    menuItemName: {
        'margin-left': '20px',
        'white-space': 'nowrap',
        'text-transform': 'capitalize'
    },
    itemPrice: {
        'padding-left': '5px'
    },
    addButton: {
        'margin-left': '25px',
    },
    cartHeader: {
        'padding-bottom': '0px',
        'margin-left': '10px',
        'margin-right': '10px'
    },
    shoppingCart: {
        color: 'black',
        'background-color': 'white',
        width: '60px',
        height: '50px',
        'margin-left': '-20px',
    },
    cardContent: {
        'padding-top': '0px',
        'margin-left': '10px',
        'margin-right': '10px'
    },
    cartItemButton: {
        padding: '10px',
        'border-radius': '0',
        color: '#fdd835',
        '&:hover': {
            'background-color': '#ffee58',
        }
    },
    CheckoutBtn: {
        'font-weight': '400'
    }
}))

class Details extends Component {

    constructor() {
        super();
        this.state = {
            restaurantPhotoUrl: "",
            restaurantId: "",
            restaurantName: "",
            locality: "",
            categories: [{}],
            rating: 0,
            numberOfCustomers: 0,
            avgCostForTwo: 0,
            itemAdded: false,
            cartItemsCount: 0,
            totalCost: 0,
            cartItems: {},
            open: false,
            successMessage: "",
            badgeVisible: false
        }
    }

    componentWillMount() {
        // Fetches details of the restaurant
        let resp = {};
        let data = null;
        let xhr = new XMLHttpRequest();
        let that = this;
        var categories = []
        xhr.addEventListener("readystatechange", function () {
            if (xhr.readyState === 4) {
                resp = JSON.parse(xhr.responseText)
                console.log(resp);
                for (var i = 0; i < resp.categories.length; i++) {
                    categories[resp.categories[i].category_name] = resp.categories[i].item_list
                }
                that.setState({
                     restaurantPhotoUrl: resp.photo_URL,
                     restaurantName: resp.restaurant_name,
                     restaurantId: resp.id,
                     locality: resp.address.locality,
                     categories: categories,
                     rating: resp.customer_rating,
                     numberOfCustomers: resp.number_customers_rated,
                     avgCostForTwo: resp.average_price});
            }
        })
        xhr.open("GET", this.props.baseUrl + "/restaurant/" + this.props.match.params.id);
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.send(data);
    }

    // This function handles adding items to the cart. It creates a structure storing the details of the item
    // and computes the total cost and total quantity of items in the cart.
    addToCart = (itemName, id, price, type) => {
        var count = this.state.cartItemsCount;
        var message = this.state.successMessage;
        var cartItems = this.state.cartItems;
        var total = 0;

        if (!cartItems.hasOwnProperty(itemName)) {
            this.setState({ itemAdded: true })

            cartItems[itemName] = {
                "id": id,
                "count": 1,
                "price": price,
                "type": type
            }
            count++;
            message = "Item added to cart!"
        } else {
            count++;
            cartItems[itemName]["count"]++;
            message = "Item quantity increased by 1!"

        }
        Object.entries(this.state.cartItems).map(item => (
            total += (item[1].count * item[1].price)
        ));
        this.setState({
            cartItems: cartItems,
            cartItemsCount: count,
            totalCost: total,
            open: true,
            successMessage: message
        });
    }

    // This function handles removal of items from the cart when the "- : minus" button is clicked.
    // It updates the total count of items in the cart and computes the total cost
    removeFromCart = (itemName) => {
        var count = this.state.cartItemsCount;
        var items = this.state.cartItems;
        var message = this.state.successMessage;
        var total = 0;
        count--;

        if (items.hasOwnProperty(itemName)) {
            items[itemName]["count"]--;
            Object.entries(this.state.cartItems).map(item => (
                total += (item[1].count * item[1].price)
            ));
            message = "Item removed from cart!"
            this.setState({
                cartItems: items,
                cartItemsCount: count,
                totalCost: total,
                open: true,
                successMessage: message
            });
        }
        else
            return
    }

    // This function leads to the checkout page if the customer is logged in (determined if the access token is present).
    // It prompts the user if the cart is empty or if the user isn't logged in
    checkout = () => {
        if (this.state.cartItemsCount === 0) {
            this.setState({
                open: true,
                successMessage: "Please add an item to your cart"
            });
        } else if (!sessionStorage.getItem("access-token")) {
            this.setState({
                open: true,
                successMessage: "Please login first!"
            });
        } else {
            var customerCart = {};
            var cartItems = [];
            Object.entries(this.state.cartItems).map( item => (
                cartItems.push({
                    id: item[1].id,
                    price: item[1].count * item[1].price,
                    count: item[1].count,
                    item_type: item[1].type,
                    item_name: item[0]
                })
            ))
            customerCart["cartItems"] = cartItems;
            customerCart["restaurantDetails"] = {
                "id": this.state.restaurantId,
                "restaurant_name": this.state.restaurantName
            }
            customerCart["totalPrice"] = this.state.totalCost;
            sessionStorage.setItem("customer-cart", JSON.stringify(customerCart));
           // this.props.history.push({
                /* pathname: '/checkout/' + this.props.match.params.id,
                cartItems: this.state.cartItems, */
                this.props.history.push("/checkout");

           // })
        }
    }

    // Closes the snackbar that pops up in case of addition/removal of items from the cart or in case the checkout button is
    //clicked
    snackbarClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        this.setState({ open: false });
    }

    // This function handles the visibility of the badge when the modal opens
    changeBadgeVisibility = () => {
        this.setState({
            ...this.state,
            badgeVisible: !this.state.badgeVisible,
        })
    }

    render() {
        const { classes } = this.props;
        var keys = Object.keys(this.state.categories)
        return (
            <div>
                <Header showSearchBox={false} changeBadgeVisibility={this.changeBadgeVisibility} />
                <div className="restaurant-details-container">
                    <div>
                        <img className="restaurant-photo" src={this.state.restaurantPhotoUrl} alt={this.state.restaurantName} />
                    </div>
                    <div className="restaurant-details">
                        <div className="restaurant-name">
                            <Typography variant='h5' component='h5' >{this.state.restaurantName}</Typography><br />
                            <Typography variant="body1">{this.state.locality.toUpperCase()}</Typography><br />
                            <Typography variant="caption">
                                {keys.map(key => (
                                    String(key) + ", "
                                ))}
                            </Typography><br /><br />
                        </div>
                        <div className="restaurant-rating-cost-container">
                            <div className="restaurant-rating-container">
                                <div className="restaurant-rating">
                                    <FontAwesomeIcon icon={faStar} />
                                    <Typography variant="subtitle1" component="p">{this.state.rating}</Typography>
                                </div>
                                <Typography variant='caption' component="p" className="caption">AVERAGE RATING BY <br />
                                    {this.state.numberOfCustomers} CUSTOMERS
                                    </Typography>
                            </div>
                            <div className="restaurant-avg-cost-container">
                                <div className="restaurant-avg-cost">
                                    <FontAwesomeIcon className="spacing" icon={faRupeeSign} />
                                    <Typography variant="subtitle1" component="p">{this.state.avgCostForTwo}</Typography>
                                </div>
                                <Typography variant='caption' className="caption">
                                    AVERAGE COST FOR <br />
                                    TWO PEOPLE
                                    </Typography>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="menu-details-cart-container">
                    <div className="menu-details">

                        {Object.entries(this.state.categories).map(category => (
                            <div key={category[0]}>
                                <Typography variant="subtitle1">{String(category[0]).toUpperCase()}</Typography>
                                <Divider />
                                {
                                    Object.entries(category[1]).map(item => (

                                        <div className="menu-item-container" key={item[1].id}>

                                            <span className="spacing">
                                                <FontAwesomeIcon icon={faCircle} className={item[1].item_type === "VEG" ? "green" : "red"} />
                                            </span>
                                            <Typography variant="subtitle1" className={classes.menuItemName}>{item[1].item_name}</Typography>
                                            <div className="item-price">
                                                <FontAwesomeIcon icon={faRupeeSign} className="icon-size spacing" />
                                                <Typography variant="subtitle1" component="p" className={classes.itemPrice} >{item[1].price.toFixed(2)}</Typography>
                                            </div>
                                            <IconButton className={classes.addButton} aria-label="add" onClick={this.addToCart.bind(this, String(item[1].item_name), item[1].id, item[1].price, item[1].item_type)}>
                                                <AddIcon />
                                            </IconButton>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                    <div className="my-cart">
                        <Card >
                            <CardHeader
                                avatar={
                                    <Avatar aria-label="shopping-cart" className={classes.shoppingCart}>
                                        <Badge invisible={this.state.badgeVisible} badgeContent={this.state.cartItemsCount} showZero color="primary" className={classes.badge}>
                                            <ShoppingCartIcon />
                                        </Badge>
                                    </Avatar>
                                }
                                title="My Cart"
                                titleTypographyProps={{
                                    variant: 'h6'
                                }}
                                className={classes.cartHeader}
                            />
                            <CardContent className={classes.cardContent}>

                                {

                                    Object.entries(this.state.cartItems).map(item => (

                                        this.state.cartItemsCount !== 0 && this.state.cartItems[item[0]]["count"] !== 0 ?

                                            <div className="cart-menu-item-container">
                                                {console.log(this.state.cartItems)}
                                                <i className="fa fa-stop-circle-o" aria-hidden="true" style={{ color: item[1].type === "NON_VEG" ? "#BE4A47" : "#5A9A5B" }}></i>
                                                <Typography variant="subtitle1" component="p" className={classes.menuItemName} id="cart-menu-item-name" >{item[0]}</Typography>
                                                <span className="dec-btn">
                                                    <IconButton id="minus-button" aria-label="remove" onClick={this.removeFromCart.bind(this, String(item[0]))} className={classes.cartItemButton}>
                                                        <FontAwesomeIcon icon={faMinus} size="xs" color="black" style={{ fontSize: 10 }} />
                                                    </IconButton>
                                                </span>
                                                <span className="count">
                                                    <Typography variant="subtitle1" component="p" className={classes.itemQuantity}>{item[1].count}</Typography>
                                                </span>

                                                <span className="inc-btn">
                                                    <IconButton className={classes.cartItemButton} aria-label="add" onClick={this.addToCart.bind(this, String(item[0]), item[1].price, item[1].type)}>
                                                        <FontAwesomeIcon icon={faPlus} size="xs" color="black" style={{ fontSize: 10 }} />
                                                    </IconButton>
                                                </span>
                                                <div className="item-price">
                                                    <FontAwesomeIcon icon={faRupeeSign} className="icon-size caption" />
                                                    <Typography variant="subtitle1" component="p" className={classes.itemPrice} id="cart-item-price">{(item[1].count * item[1].price).toFixed(2)}</Typography>
                                                </div>
                                            </div> : null
                                    ))}
                                <div className="total-amount-container">
                                    <Typography variant="subtitle2">
                                        <Box fontWeight="fontWeightBold">TOTAL AMOUNT</Box>
                                    </Typography>
                                    <div className="total-price">
                                        <FontAwesomeIcon icon={faRupeeSign} />
                                        <Typography variant="subtitle1" component="p" className={classes.itemPrice} id="cart-total-price">{this.state.totalCost.toFixed(2)}</Typography>
                                    </div>
                                </div>
                                <div>
                                    <Button variant="contained" color="primary" fullWidth={true} className={classes.CheckoutBtn} onClick={this.checkout}>CHECKOUT</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Snackbar
                    anchorOrigin={{
                        horizontal: "left",
                        vertical: "bottom"
                    }}
                    open={this.state.open}
                    onClose={this.snackbarClose}
                    autoHideDuration={5000}
                    ContentProps={{
                        "aria-describedby": "message-id"
                    }}
                    message={<span id="message-id">{this.state.successMessage}</span>}
                />
            </div>
        )
    }
}
export default withStyles(styles)(Details);
