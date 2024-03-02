const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

mongodb_uri = process.env.ATLAS_URI;
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(mongodb_uri);
const connection = mongoose.connection;
connection.once('open', ()=>{
    console.log("connected to mongoose database successfully.");
});

const Schema = mongoose.Schema;

const itemsSchema = new Schema({
    name:String,
});

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
    name:"Enter your todo here."
});
const item2 = new Item({
    name:"Hit the + button to add a new todo."
});
const item3 = new Item({
    name:"<-- Hit this to delete the todo."
});
const defaultItems = [item1, item2, item3];

const listsSchema = new Schema({
    name:String,
    items:[itemsSchema]
});
const List = mongoose.model("List", listsSchema);

app.get("/", (req, res)=>{
    Item.find({}).then((data) => {
        if(data.length === 0){
            Item.insertMany(defaultItems).then(() => console.log("ManyItems saved!"));
            res.redirect("/");
        }else{
            res.render("list", {listTitle: "Today", newitems: data});
        }
    })
});

app.get("/:customListName", (req,res)=>{
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name:customListName}).then((foundList)=>{
        if(!foundList){
            const list1 = new List({
                name:customListName,
                items:defaultItems,
            });
            list1.save();
            res.redirect("/"+customListName);
        }
        else{
            res.render("list", {listTitle: foundList.name, newitems: foundList.items});
        }
    });
});

app.post("/", (req,res)=>{
    var item = req.body.newitem;
    var list_name = req.body.list;

    const nextitem = new Item({
        name:item
    });

    if(list_name === "Today"){
        nextitem.save();
        res.redirect("/");
    }else{
        List.findOne({name:list_name}).then((foundList) => {
            foundList.items.push(nextitem);
            foundList.save();
            res.redirect("/"+list_name);
        });
    }
});

app.post("/delete", (req,res) =>{
    const item_id = req.body.checkbox;
    const list_name = req.body.listname;
    
    if(list_name === "Today"){
        Item.findByIdAndDelete(item_id).then(()=>{console.log("ITEM DELETED!")})
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name:list_name}, {$pull: {items: {_id: item_id}}}).then(() => {
            res.redirect("/" + list_name);
        })
    }
});

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000");
});