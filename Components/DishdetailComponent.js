import React, { Component } from 'react';
import { View, SafeAreaView, Text, ScrollView, FlatList, StyleSheet, Modal, Alert, PanResponder ,Share} from 'react-native';
import { Card, Icon, Button, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites,
    };
};

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});

const shareDish = (title, message, url) => {
    Share.share({
        title: title,
        message: title + ': ' + message + ' ' + url,
        url: url
    },{
        dialogTitle: 'Share ' + title
    })
}

function RenderDish(props) {
    const dish = props.dish;
    var view;

    const handleViewRef = ref => view = ref;

    const recongnizeDrag = ({ moveX, moveY, dx, dy }) => {
        if (dx < -200) {
            return true;
        }
        return false;
    };

    const recognizeComment = ({ moveX, moveY, dx, dy }) => {
        if (dx > 200) {
            return true;
        }
        return false;
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },
        onPanResponderGrant: () => {
            view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'canceled'));
            return true;
        },
        onPanResponderEnd: (e, gestureState) => {
            if (recognizeComment(gestureState)) {
                props.onPressComment();
            }
            if (recongnizeDrag(gestureState)) {
                Alert.alert(
                    'Add to favorites?',
                    'Are you sure you want to add ' + dish.name + ' to your favorites?',
                    [
                        {
                            text: 'cancel',
                            onPress: () => console.log('Cancel pressed'),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: () => props.favorite ? console.log('Already favorite') : props.onPress()
                        }
                    ],
                    { cancelable: false }
                );
            }
            return true;
        },
    });

    if (dish != null) {
        return (
            <Animatable.View animation="fadeInDown" duraion={2000} delay={1000}
                ref={handleViewRef}
                {...panResponder.panHandlers}
            >
                <Card
                    featuredTitle={dish.name}
                    image={{ uri: baseUrl + dish.image }}
                >
                    <Text style={{margin: 10}}>
                        {dish.description}
                    </Text>
                    <View style={{
                        paddingVertical: 15,
                        paddingHorizontal: 10,
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Icon
                            raised reverse
                            name={props.favorite ? 'heart' : 'heart-o'}
                            type='font-awesome'
                            color='#f50'
                            onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
                        />
                        <Icon
                            raised reverse
                            name='pencil'
                            type='font-awesome'
                            color='#52A'
                            onPress={() => props.onPressComment()}
                            />
                        <Icon
                            raised
                            reverse
                            name='share'
                            type='font-awesome'
                            color='#51D2A8'
                            style={styles.cardItem}
                            onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} 
                        />
                    </View>
                </Card >
            </Animatable.View>
        );
    }
    else
    {
        return(<View></View>);
    }
}

function RenderComments(props) {
    const comments = props.comments;
    const renderCommentItem = ({ item, index }) => {
        return (
            <View key={index} style={{ margin: 10 }}>
                <Text style={{ fontSize: 14 }}>{item.comment}</Text>
                <View style={{ margin: 10 }}>
                    <Rating
                        startingValue={item.rating}
                        imageSize={16}
                        style={{ alignSelf: 'flex-start' }}
                    readonly
                />
                </View>
                <Text style={{ fontSize: 12 }}>{'-- ' + item.author + ', ' + item.date}</Text>
            </View>
        );
    }

    return (
        <Animatable.View animation="fadeInUp" duraion={2000} delay={1000}>
            <Card title="Comments">
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()}
                />
            </Card>
        </Animatable.View>
    );
}

class DishDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rating: 5,
            guest: '',
            message: '',
            showModal: false
        };
    }

    toggleModal() {
        this.setState({ showModal: !this.state.showModal });
    }

    resetForm() {
        this.setState({
            rating: 5,
            guest: '',
            message: '',
            showModal: false
        });
    }

    submitComment(dishId, rating, author, comment) {
        console.log(JSON.stringify(this.state));
        this.props.postComment(dishId, rating, author, comment);
        this.resetForm();
    }
    
    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    };

    static navigationOptions = {
        title: 'Dish Details'
    };    
    
    render(){
        const dishId = this.props.navigation.getParam('dishId', '');
        return (
            <ScrollView>
                <RenderDish
                    dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)}
                    onPressComment={() => this.toggleModal()}
                />
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />

                <Modal animationType={"slide"} transparent={false}
                    visible={this.state.showModal}
                    onRequestClose={() => this.toggleModal()}>
                    <SafeAreaView style={styles.modal}>
                        <View style={{ marginTop: 10 }}>
                            <Rating
                                showRating
                                startingValue={this.state.rating}
                                fractions={0}
                                onFinishRating={(rating) => this.setState({ rating: rating })}
                            />
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Input
                                placeholder="Author"
                                leftIcon={{ type: 'font-awesome', name: 'user-o' }}
                                leftIconContainerStyle={{ paddingRight: 10 }}
                                onChangeText={value => this.setState({ guest: value })}
                            />
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Input
                                placeholder="Comment"
                                leftIcon={{ type: 'font-awesome', name: 'comment-o' }}
                                leftIconContainerStyle={{ paddingRight: 10 }}
                                onChangeText={value => this.setState({ message: value })}
                            />
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Button
                                onPress={() => { this.submitComment(dishId, this.state.rating, this.state.guest, this.state.message) }}
                                buttonStyle={{ backgroundColor: '#512DA8' }}
                                title="Submit"
                            />
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Button
                                onPress={() => { this.resetForm() }}
                                title="Cancel"
                                buttonStyle={{ backgroundColor: 'grey' }}
                                raised 
                            />
                        </View>
                    </SafeAreaView>
                </Modal>

            </ScrollView>
        );
    };
}

const styles = StyleSheet.create({
    formRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin: 20,
    },
    formLable: {
        fontSize: 18,
        flex: 2,
        flexDirection: 'row',
    },
    formItem: {
        flex: 1,
    },
    modal: {
        justifyContent: 'center',
        margin: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#512DA8',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20
    },
    modalText: {
        fontSize: 18,
        margin: 10,
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(DishDetail);


/*import React,{ Component  } from 'react';
import { Text, View, ScrollView, FlatList, Modal, StyleSheet, Alert, PanResponder,SafeAreaView } from 'react-native';
import { Card, Icon, Button, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite,postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
      dishes: state.dishes,
      comments: state.comments,
      favorites:state.favorites
    }
  }

  const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))

})


function RenderDish(props){
    
    const dish=props.dish;


    const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
        if ( dx < -200 )
            return true;
        else
            return false;
    }

    handleViewRef = ref => this.view = ref;
    
    const panResponder = PanResponder.create({
        
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },

        onPanResponderGrant: () => {
            this.view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));
        },

        onPanResponderEnd: (e, gestureState) => {
            console.log("pan responder end", gestureState);
            if (recognizeDrag(gestureState))
                Alert.alert(
                    'Add Favorite',
                    'Are you sure you wish to add ' + dish.name + ' to favorite?',
                    [
                    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    {text: 'OK', onPress: () => {props.favorite ? console.log('Already favorite') : props.onPress()}},
                    ],
                    { cancelable: false }
                );
    
            return true;
        }
    })
    
    if(dish!=null){
            return (
                <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
                ref={this.handleViewRef}
                {...panResponder.panHandlers}>
                <Card
                featuredTitle={dish.name}
                image={{uri: baseUrl + dish.image}}>
                    <Text style={{margin: 10}}>
                        {dish.description}
                    </Text>

                    <View style={{
                        paddingVertical: 15,
                        paddingHorizontal: 10,
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Icon
                            raised reverse
                            name={props.favorite ? 'heart' : 'heart-o'}
                            type='font-awesome'
                            color='#f50'
                            onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
                        />
                        <Icon
                            raised reverse
                            name='pencil'
                            type='font-awesome'
                            color='#52A'
                            onPress={() => props.onPressComment()}
                            />
                    </View>
                </Card>    
                </Animatable.View>        
            );
    }
    else{
        return(<View></View>);
    }

}
function RenderComments(props) {

    const comments = props.comments;
            
    const renderCommentItem = ({item, index}) => {
        
        return (
            <View key={index} style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.comment}</Text>
                <Text style={{fontSize: 12}}>{item.rating} Stars</Text>
                <Text style={{fontSize: 12}}>{'-- ' + item.author + ', ' + item.date} </Text>
            </View>
        );
    };
    
    return (
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>        
        <Card title='Comments' >
        <FlatList 
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={item => item.id.toString()}
            />
        </Card>
        </Animatable.View>
    );
}

class DishDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rating: 5,
            guest: '',
            message: '',
            showModal: false
        };
    }

    toggleModal() {
        this.setState({ showModal: !this.state.showModal });
    }

    resetForm() {
        this.setState({
            rating: 5,
            guest: '',
            message: '',
            showModal: false
        });
    }

    submitComment(dishId, rating, author, comment) {
        console.log(JSON.stringify(this.state));
        this.props.postComment(dishId, rating, author, comment);
        this.resetForm();
    }

    static navigationOptions = {
        title: 'Dish Details'
    };

    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    render() {
        const dishId = this.props.navigation.getParam('dishId','');
        return(
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)} 
                    onPressComment={() => this.toggleModal()}
                    />
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />

                <Modal animationType={"slide"} transparent={false}
                    visible={this.state.showModal}
                    onRequestClose={() => this.toggleModal()}>
                    <SafeAreaView style={styles.modal}>
                        <View style={{ marginTop: 10 }}>
                            <Rating
                                showRating
                                startingValue={this.state.rating}
                                fractions={0}
                                onFinishRating={(rating) => this.setState({ rating: rating })}
                            />
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Input
                                placeholder="Author"
                                leftIcon={{ type: 'font-awesome', name: 'user-o' }}
                                leftIconContainerStyle={{ paddingRight: 10 }}
                                onChangeText={value => this.setState({ guest: value })}
                            />
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Input
                                placeholder="Comment"
                                leftIcon={{ type: 'font-awesome', name: 'comment-o' }}
                                leftIconContainerStyle={{ paddingRight: 10 }}
                                onChangeText={value => this.setState({ message: value })}
                            />
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Button
                                onPress={() => { this.submitComment(dishId, this.state.rating, this.state.guest, this.state.message) }}
                                buttonStyle={{ backgroundColor: '#512DA8' }}
                                title="Submit"
                            />
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Button
                                onPress={() => { this.resetForm() }}
                                title="Cancel"
                                buttonStyle={{ backgroundColor: 'grey' }}
                                raised 
                            />
                        </View>
                    </SafeAreaView>
                </Modal>

            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    formRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin: 20,
    },
    formLable: {
        fontSize: 18,
        flex: 2,
        flexDirection: 'row',
    },
    formItem: {
        flex: 1,
    },
    modal: {
        justifyContent: 'center',
        margin: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#512DA8',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20
    },
    modalText: {
        fontSize: 18,
        margin: 10,
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(DishDetail);
*/