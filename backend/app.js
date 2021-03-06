const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql');
const mongoose = require('mongoose');
const isAuth = require('./middleware/is-auth');
const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');
const socket = require('socket.io');

const { ObjectId } = mongoose.Types;
ObjectId.prototype.valueOf = function () {
  return this.toString();
};
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(isAuth);
app.use('/graphql', graphQlHttp({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true
})
);

// mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-autbo.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`, { useNewUrlParser: true })

mongoose.connect('mongodb://localhost:27017/TasksApp', { useNewUrlParser: true })
    .then(() => {
        console.log('connected');
        const server = app.listen(3000);
        const io = socket(server);
        io.on('connection', (socket) => {
            console.log('client connected');
            socket.on('updated', (data) => {
                // io.sockets.emit('updated', data);
                socket.broadcast.emit('updated', data);
            });
        });
    })
    .catch(err => {
        console.log(err);
    });