const Contact = require('../models/contact');

const PostQuery = async(req, res) => {
    try{
        const {name, email, number, query} = req.body;
        const newQuery = await new Contact({
            name, 
            email, 
            contact: number,
            query
        }).save();

        res.status(201).json({message: 'Your query is submitted!', result: newQuery})

    }catch(err){
        res.status(500).json({message: 'Something went wrong!', error: err.message})
    }
}

module.exports = {PostQuery};