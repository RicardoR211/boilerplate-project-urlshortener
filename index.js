const mongoose = require('mongoose');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { parse } = require('dotenv');
const app = express();

const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/DataBase');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

//Iniciando o programa
//Criando o modelo
const urlSchema = new Schema({
    url: String,
    shortened: Number
});

//Criando  o model
const urlPerson = mongoose.model('Urls', urlSchema);

//Agora a gente vai procurar se aquela url ja foi criada no banco de dados
const findOrCreateUrl = async (_url) =>{
    //A gente tenta encontrar
    try {
        const foundUrl = await urlPerson.findOne({url: _url});

        if(foundUrl){
            //OU seja, tem uma url ja salva no banco de dados
            return foundUrl;
        } else {
            //Não tem a url salva
            const newShortened = await urlPerson.countDocuments() + 1;
            const newUrl = new urlPerson({
                url: _url,
                shortened: newShortened
            });
            
            return await newUrl.save();
        }
    } catch(err) { //tratando erro
        throw new Error('Deu ruim ao processar a URL.');
    }
}

//Função doida para procurar o url encurtado
const findUrlShortener = async (_shortUrl) =>{
    //Tentando encontrar se tem uma url encurtada com aquele value
    try {
        const foundFromShort = await urlPerson.findOne({shortened: _shortUrl});
        return foundFromShort;

    } catch (err) {
        throw new Error('Não tem essa URL encurtada no banco de dados');
    }
}

app.post('/api/shorturl', async (req, res) => {
    const urlFromRequest = req.body.url;
    let parsedUrl;

    //Verificando se a url é algo valido
    try {
        parsedUrl = new URL(urlFromRequest);
    } catch (err) {
        return res.json({error: 'invalid url'});
    }
    //console.log(urlFromRequest);

    //Verificando o protocolo dnv
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:'){
        return res.json({error: 'invalid url'});
    }

    try {
        //Tentando achar se aquela URL ja esta salva
        const result = await findOrCreateUrl(urlFromRequest);
        res.json({
            original_url: result.url,
            short_url: result.shortened
        });

    } catch (err) {
        res.json({error: err.message});
    }
});

app.get('/api/shorturl/:urlshort', async (req, res)=>{
    const shortUrlToFind = req.params.urlshort;

    if(!shortUrlToFind) return res.json({error: 'invalid shorter url'});

    try {
        //Tentando achar a url encurtada
        const result = await findUrlShortener(shortUrlToFind);
        
        if(result) res.redirect(result.url);
        else res.json({error: 'No short URL found for given input'});
    } catch (err) {
        res.json({err: 'Erro na consulta'});   
    }
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
    res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
