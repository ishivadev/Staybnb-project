const Listing = require("../Models/listingModel.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    // let allListings =  await Listing.find({});
    // //console.log(allListings);
    // res.render("listings/index.ejs", { allListings });

    let { q } = req.query;
    let allListings;

    if(q) {
        allListings = await Listing.find({ title: {$regex: q, $options: 'i'}});
    } else {
        allListings = await Listing.find({});
    }
    res.render("listings/index.ejs", { allListings, q });
}


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}


module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate( { path: "reviews", populate: { path: "author" } } ).populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exists!");
        return res.redirect("/listings");
    }
    //console.log(listing);
    res.render("listings/show.ejs", { listing });
}


module.exports.createListing = async (req, res, next) => {
    // let response = geocodingClient.forwardGeocode({
    //     query: req.body.listing.location,
    //     limit: 1,
    //   })
    //     .send()
    //console.log(response.body.features[0].geometry)
    
    let url = req.file.path;
    let filename = req.file.filename;
    let newListing = new Listing(req.body.listing);   
    
    console.log(req.user);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    //newListing.geometry = response.body.features[0].geometry;
    await newListing.save();
    req.flash("success", "New Listing Created.");
    res.redirect("/listings");
    console.log(newListing); 
}


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exists!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
}


module.exports.updateListing = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate({_id: id}, {...req.body.listing},  { new: true, runValidators: true });
    
    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image  = { url, filename };
        await listing.save();
    }
    req.flash("success", "Listing Updated.");
    res.redirect(`/listings/${id}`);
    //console.log(listing);
}


module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id); //POST middleware is working after the delet query using the 'deletedListing'
    req.flash("success", "Listing Deleted.");
    //console.log(`Deleted listing for Post middleware: ${deletedListing}`);
    res.redirect("/listings");
}