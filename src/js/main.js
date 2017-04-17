//Event listeners that handles page load, submit movie button, search submit, feature "buttons" on page header and toggling of form fields.
(function() {
    //dom ready - load all movies
    window.addEventListener("DOMContentLoaded", () => api.getMovies());

    //nav "show all movies". Gets all from API once again
    document.getElementById("show-all-movies").addEventListener("click", () => api.getMovies());

    //evt quick search
    document.getElementById("quick-search-btn").addEventListener("click", () => search.quickSearch());

    //event listener for add new movie submit button
    document.getElementById("add-submit").addEventListener("click", () => {
        let title = document.getElementById("add-title").value;
        title.length === 0 ? alert("Please provide a title for your movie!") : makeNew.makeMovie();
    });

    //evt add cancel
    document.getElementById("add-cancel").addEventListener("click", () => makeNew.resetAddForm());

    //evt search cancel
    document.getElementById("search-cancel").addEventListener("click", () => makeNew.resetSearchForm());

    //evt advanced search submit button
    document.getElementById("search-submit").addEventListener("click", () => search.makeSearchObject());

    //evt edit genre modal submit
    document.getElementById("edit-genre-submit").addEventListener("click", () => {
        let addGenre = Array.from(document.querySelectorAll("#edit-genre-form input:checked")).map((val) => { return val.value; });
        let id = event.target.getAttribute("data-id");
        store.editGenre(addGenre, id);
    });
})();

/**
 * Module #1 - make new movies. The add form input is collected and made into an object using a constructor and some helper methods which are set to 
 * the constructor prototype. To have the constructor inside a closure is also handy because local var idCounter can be stored outside and provide 
 * a unique id to every object passing through the constructor (would otherwise have been reset). The movies are then passed on to the storage.
 */
var makeNew = (function() {
    //var idCounter = -1;

    //Movie constructor
    function Movie(title, rating, year, genre, cover, director, starring) {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
        //this.id = idCounter++;
        this.averageRating = avRating(this.rating);
    }

    //old prototype method that calcs average rating
    // Movie.prototype.getAverageRating = function() {
    //     let rating = parseFloat((this.rating.reduce((prev, cur) => prev + cur) / this.rating.length).toFixed(1));
    //     return rating;
    // };

    Movie.prototype.makeArray = function(string) {
        return string.split(", ");
    };

    /**
     * Runs when "submit-movie" button is clicked.
     */
    function makeMovie() {
        let movieTitle = document.getElementById("add-title").value;
        let movieRating = parseInt(document.getElementById("add-rating").value);
        let movieYear = parseInt(document.getElementById("add-year").value);
        let movieGenre = Array.from(document.querySelectorAll(".add-genre:checked")).map((val) => { return val.value; });
        let movieCover = document.getElementById("add-cover").value;
        let movieDirector = ("") ? undefined : document.getElementById("add-director").value;
        let movieStarring = document.getElementById("add-starring").value;

        var newMovie = new Movie(movieTitle, movieRating, movieYear, movieGenre, movieCover, movieDirector, movieStarring);
        newMovie.starring = newMovie.makeArray(newMovie.starring);

        //post the new movie
        api.postMovie(newMovie);
        resetAddForm();
    }

    /**
     * Returns the average rating
     * @param {array} arr - the ratings array
     */
    function avRating(arr) {
        let rating = parseFloat((arr.reduce((prev, cur) => prev + cur) / arr.length).toFixed(1));
        return rating;
    }

    /**
     * Resets the add form after search or cancel
     */
    function resetAddForm() {
        let inputs = document.querySelectorAll("#add-movie-form input");
        inputs.forEach((el) => {
            if (el.type == "text" || el.type == "url") el.value = "";
            if (el.type == "checkbox") el.checked = false;
            if (el.type == "number") el.value = 2017;
        });
        document.querySelectorAll("#add-rating option").forEach((el) => {
            if (el.value == "5") el.selected = "selected";
        });
    }

    /**
     * Resets the search form after search or cancel
     */
    function resetSearchForm() {
        let inputs = document.querySelectorAll("#search-movie-form input");
        inputs.forEach((el) => {
            if (el.type == "text" || el.type == "url") el.value = "";
            if (el.type == "checkbox") el.checked = false;
            yearSlider.noUiSlider.set(1920, 2020);
            ratingSlider.noUiSlider.set(1, 10);
        });
    }

    return {
        makeMovie: makeMovie,
        Movie: Movie,
        resetAddForm: resetAddForm,
        resetSearchForm: resetSearchForm,
        avRating: avRating
    };
})();

/**
 * module #2 - Database. My existing movies are tucked away in storage here with no risk of manipulation once created.
 * The module is providing public endpoints which are basically CRUD-methods (minus delete) to meet my specific needs.
 */
var store = (function() {
    //This is the array where all the movies are stored.
    var movieDatabase = [];
    //This is the array of our current selection - not needed
    var currentSelection = [];

    return {
        getAllMovies: function() {
            return movieDatabase;

        },

        refreshMovies: function(movies) {
            return print.printMovies(movies);
        },

        //riginal function pushing movies to array REMOVE?
        // addMovie: function(obj) {
        //     movieDatabase.push(obj);
        // },

        /**
         * gets an array from the api, stores and sends to print
         */
        storeMovies: function(movies) {
            movieDatabase = movies;
            store.refreshMovies(movieDatabase);
        },

        /**
         * Adds event listeners to all add-rating-button + Adds rating to a movie when the button is clicked. 
         */
        addRating: function(movies) {
            //select all the rate-buttons
            document.querySelectorAll(".rate-btn").forEach((el) => {
                //add click listerners for each
                el.addEventListener("click", () => {
                    //get the id of the movie that was clicked
                    let targetId = parseInt(el.getAttribute("data-id"));
                    // + the new value
                    let rating = parseInt(document.getElementById("selectId-" + targetId).value);

                    //now we need to push the new rating to the arr, update the average and patch
                    let targetMovie = movies.filter((el) => {
                        if (el.id === targetId) return el;
                    });

                    let ratingsArr = targetMovie[0].rating;
                    ratingsArr.push(rating);
                    let newAverage = makeNew.avRating(ratingsArr);

                    let ratingsPatch = {
                        rating: ratingsArr,
                        averageRating: newAverage
                    };

                    api.patchMovie(targetId, ratingsPatch);
                });
            });
        },

        /**
         * Sends new genres to api patch
         */
        editGenre: function(newGenres, id) {
            let genresPatch = {
                genre: newGenres
            };
            api.patchMovie(id, genresPatch);
        },

        //stores and gets current selection to prevent all movies from showing up when we add a grade or genre.
        storeCurrentSelection: function(arr) {
            this.currentSelection = arr;
        },
        getCurrentSelection: function() {
            return this.currentSelection;
        }
    };
})();


/**
 * Module #3 - Search. This one ectracts the data from the search form making it a search object. It then sends the object to the performSearch
 * function that compares it to the movie databases' movie prop/values using some helper methods. It returns a search result array that is 
 * stored and sent to the print module
 */
var search = (function() {

    /**
     * Sends a simple querystring from the quick search to the api
     */
    function quickSearch() {
        let input = document.getElementById("quick-search-text");
        let string = "?q=" + qSpace(input.value);
        api.getMovies(string);
        input.value = "";
    }

    //Kinda unnecessary to have a new constructor for the searches and make Movie it's prototype. I did this to 
    //give acess to Movie's makeArray function. Could have just made it a public function but this more fun :)
    function Search() {}
    Search.prototype = new makeNew.Movie();

    /**
     * Makes a search object based on the advanced search form input.
     */
    function makeSearchObject() {
        var searchObj = new Search();

        //rest of this func checks if the input fields have something in them. if not, that search property will be left out.
        //year and ratings span do always have a value (and is set to maximum by default).
        let searchTitle = document.getElementById("search-title").value;
        if (searchTitle.length !== 0) searchObj.title = searchTitle;

        searchObj.rating = ratingSlider.noUiSlider.get();
        searchObj.year = yearSlider.noUiSlider.get();

        let filterGenre = Array.from(document.querySelectorAll(".filter-genre:checked")).map((val) => { return val.value; });
        if (filterGenre.length !== 0) searchObj.genre = filterGenre;

        let searchDirector = document.getElementById("search-director").value;
        if (searchDirector.length !== 0) searchObj.director = searchDirector;

        let searchStarring = document.getElementById("search-starring").value;
        if (searchStarring.length !== 0) searchObj.starring = searchStarring;

        //search object --> query string --> api.
        api.getMovies(makeQueryString(searchObj));
        makeNew.resetSearchForm();
    }

    /**
     * Function that produces a querystring for the API instead of filtering the movie array client side.
     * * @param {arr} searchObj - what user is looking for
     */
    function makeQueryString(searchObj) {
        let queryString = "?";
        queryString += searchObj.title ? "title_like=" + qSpace(searchObj.title) : "";
        queryString += searchObj.director ? "&director_like=" + qSpace(searchObj.director) : "";
        queryString += searchObj.starring ? "&starring_like=" + qSpace(qComma(searchObj.starring)) : "";
        if (searchObj.genre) {
            searchObj.genre.forEach(function(el) {
                queryString += "&genre_like=" + el;
            });
        }
        queryString += "&year_gte=" + searchObj.year[0] + "&year_lte=" + searchObj.year[1];
        queryString += "&averageRating_gte=" + searchObj.rating[0] + "&averageRating_lte=" + searchObj.rating[1];
        return queryString;
    }

    /**
     * replaces spaces with +
     * @param {string} string 
     */
    function qSpace(string) {
        return string.replace(/ /g, "+");
    }

    /**
     * replaces spaces with +
     * @param {string} string 
     */
    function qComma(string) {
        return string.replace(/,/g, "&");
    }

    return {
        makeSearchObject: makeSearchObject,
        quickSearch: quickSearch
    };
})();

/**
 * Module #4 - print-to-screen. The main (public) function printMovies takes an array and prints each item to screen.
 * It also has some private helper methods. This module also contains other screen-related functions such as search and 
 * add box toggle for example.
 */
var print = (function() {

    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function printGenres(arr) {
        let genreCode = "";
        for (let el in arr) {
            genreCode += `<div class="genre-box">${arr[el]}</div>`;
        }
        return genreCode;
    }

    /**
     * Function for rendering the genre boxes in the modal dynamically based on aldready aquired genres.
     * @param {array} movies - all movies printed
     */
    function renderGenresModal(movies) {

        //Selecting all the "edit genre"-buttons
        document.querySelectorAll(".edit-genre-button").forEach((el) => {
            //adding event listeners for each - with a huge anon function
            el.addEventListener("click", () => {
                //extracting the id from the button clicked
                let targetId = parseInt(el.id.split("-")[1]);
                //filtering out the movie with the same id
                let targetMovie = movies.filter((el) => {
                    if (el.id === targetId) return el;
                });
                //It now lives in an array with only one object [0]
                let curGenre = targetMovie[0].genre;
                let allGenres = ["Drama", "Romantic", "Comedy", "Thriller", "Action", "Horror", "Sci-fi", "Documentary", "Animated", "Kids"];
                let genreBoxes = "";
                document.getElementById("edit-genre-title").innerHTML = `Edit genres for: ${targetMovie[0].title}`;
                //looping through all genres to find out which ones the movie already has
                for (let thisGenre of allGenres) {
                    let added = false;
                    //by looping through its genres each time.
                    for (let has of curGenre) {
                        if (thisGenre == has) {
                            genreBoxes += genreModalCode(thisGenre, targetId, "checked");
                            added = true;
                        }
                    }
                    if (!added) genreBoxes += genreModalCode(thisGenre, targetId, "");
                }
                //adding event listeners for the buttons in the genre modal
                document.getElementById("edit-genre-modal-content").innerHTML = genreBoxes;
                document.getElementById("edit-genre-submit").setAttribute("data-id", targetId);
            });
        });
    }

    /**
     * 
     * @param {string} genre - this genre
     * @param {number} id - this movie id
     * @param {string} checked - "checked" or "";
     */
    function genreModalCode(genre, id, checked) {
        return `<div class="form-check-inline">
            <label class="form-check-label add-genre">
            <input type="checkbox" class="edit-genre-${id} form-check-input" value="${genre}" ${checked}>${genre}
            </label>
        </div>`;
    }

    /**
     * returns a string of an object, for several actors
     * @param {object} val 
     */
    function joinArray(val) {
        if (typeof val === "object") {
            return val.join(", ");
        }
        return val;
    }

    return {

        /**
         * Main function thats prints the movie cards
         */
        printMovies: function(movies) {
            var moviesToPrint = movies;
            var wrapper = document.getElementById("movie-wrapper");
            wrapper.innerHTML = "";
            if (moviesToPrint.length === 0) {
                wrapper.innerHTML = `<p id="no-result">Sorry, no result</p>`;
            } else {

                /* I want the latest movies to be displayed first. But in creation the movies are pushed into the array 
                so that their id:s are the same as their index. That's why the array is printed out in reverse.*/
                for (let i = moviesToPrint.length - 1; i >= 0; i--) {
                    let movie = moviesToPrint[i];

                    wrapper.innerHTML += `
        <div class="card moviebox">
            <div class="card-block card-block-poster">
                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
            </div>
            <div class="card-block card-block-content">
                <h4 class="title">${movie.title} <span class="tone-down">(${movie.year})</span></h4>
                <p>Director: <span class="credits tone-down">${movie.director}</span></p>
                <p>Starring: <span class="credits tone-down">${joinArray(movie.starring)}</span></p>        
                </div>
                <div class="card-footer card-footer-genres">
                    ${printGenres(movie.genre)}
            </div>
                
            <div class="card-footer card-footer-rating">
                <div class="nobreak"><p>Rating: <span class="${setGradeColor(movie.averageRating)}">${movie.averageRating}</span>
                <span class="credits tone-down"> (${movie.rating.length} votes)</span>
            </p>
            </div>
            </div>
            
            <div class="card-footer">
            <div>
            <a class="inline-link edit-genre-button" id="openGenreBox-${movie.id}" data-toggle="modal" data-target="#edit-genre-modal">&#10148; Edit genre</a> |
                <a class="inline-link rate-btn" data-id="${movie.id}"> &#10148; Rate it!</a>
                <select id="selectId-${movie.id}">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5" selected="selected">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>
            </div>          
            </div>

                `;
                }
            }
            //sends the current selection to storage so we can display it again. DONT KNOW IF THERE'S A NEED FOR CURRENT SELECTION ANYMORE
            store.storeCurrentSelection(moviesToPrint);
            renderGenresModal(moviesToPrint);
            store.addRating(moviesToPrint);
        },
    };
})();


//-----------------------------------------------//

//Sliders for the search. Only possible to get values, no input allowed.
//Made using the noUISlider library - https://refreshless.com/nouislider/
//with help from the wNumb number formatting library - https://refreshless.com/wnumb/
//These libraries use the factory pattern, so I make two of my own sliders using Object.create() and some customizing.


var yearSlider = document.getElementById("slider-year");
var ratingSlider = document.getElementById("slider-rating");

noUiSlider.create(yearSlider, {
    start: [1920, 2020],
    connect: true,
    step: 1,
    tooltips: [true, true],
    range: {
        'min': 1920,
        'max': 2020
    },
    format: wNumb({
        decimals: 0
    }),
    pips: {
        mode: 'positions',
        values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    }
});

noUiSlider.create(ratingSlider, {
    start: [1, 10],
    connect: true,
    step: 1,
    tooltips: [true, true],
    range: {
        'min': 1,
        'max': 10
    },
    format: wNumb({
        decimals: 0
    }),
    pips: {
        mode: 'values',
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        density: 10,
        stepped: true
    }
});