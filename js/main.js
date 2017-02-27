//event handlers
window.addEventListener("DOMContentLoaded", () => store.refreshMovies(store.getAllMovies()));
document.getElementById("add-submit").addEventListener("click", () => makeNew.makeMovie());
document.getElementById("search-submit").addEventListener("click", () => search.makeSearchObject());
document.getElementById("show-all-movies").addEventListener("click", () => store.refreshMovies(store.getAllMovies()));
document.getElementById("get-best-rated").addEventListener("click", () => store.refreshMovies(store.getTopRatedMovie()));
document.getElementById("get-lowest-rated").addEventListener("click", () => store.refreshMovies(store.getWorstRatedMovie()));

Array.from(document.getElementsByClassName("toggleButton")).forEach((el) => {
    el.addEventListener("click", () => {
        print.toggleBox(event.target.className);
    });
});

/*I basically have a number modules that handle all functionality, for grouping and privacy puropses: 
as much as possible of their variables and functions are private, they have a public API with functions necessary to communicate with each other.

Module #1 - to make new movies. Revealing module pattern. The add form input is made into an object using a constructor. 
To have the constructor inside a closure is also handy because local var idCounter can be stored and provide a unique id 
to every object passing through the constructor. The movies are then passed on to the storage. */

var makeNew = (function() {
    var idCounter = -1;

    function Movie(title, rating, year, genre, cover = "images/nocover.jpg", director = "N/A", starring = "N/A") {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
        this.id = idCounter++;
        this.averageRating = this.getAverageRating();
    }

    Movie.prototype.getAverageRating = function() {
        let rating = parseFloat((this.rating.reduce((prev, cur) => prev + cur) / this.rating.length).toFixed(1));
        return rating;
    };

    Movie.prototype.makeArray = function(string) {
        return string.split(", ");
    };

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

        store.addMovie(newMovie);
        store.refreshMovies(store.getAllMovies());
        print.toggleBox();
        document.getElementById("add-movie-form").reset();
        /*if (title.length !== 0) newMovie.title = title;
        if (rating.length !== 0) newMovie.rating = [rating];
        if (year.length !== 0) newMovie.year = year;
        if (genre.length !== 0) newMovie.genre = genre;
        if (cover.length !== 0) newMovie.cover = cover;
        if (director.length !== 0) newMovie.director = director;
        if (starring.length !== 0) newMovie.starring = newMovie.makeArray(starring);*/
    }

    return {
        makeMovie: makeMovie,
        Movie: Movie
    };
})();

//SEARCH

var search = (function() {
    //Kinda unnecessary to make a new prototype for the searches and make Movie it's prototype. I did this to 
    //give acess to Movie's makeArray function. Could have just made it a public function but this more fun :)
    function Search() {}
    Search.prototype = new makeNew.Movie();

    function makeSearchObject() {
        var searchObj = new Search();

        let searchTitle = document.getElementById("search-title").value;
        if (searchTitle.length !== 0) searchObj.title = searchTitle;

        searchObj.rating = ratingSlider.noUiSlider.get();
        searchObj.year = yearSlider.noUiSlider.get();

        let filterGenre = Array.from(document.querySelectorAll(".filter-genre:checked")).map((val) => { return val.value; });
        if (filterGenre.length !== 0) searchObj.genre = filterGenre;

        let searchDirector = document.getElementById("search-director").value;
        if (searchDirector.length !== 0) searchObj.director = searchDirector;

        let searchStarring = document.getElementById("search-starring").value;
        if (searchStarring.length !== 0) searchObj.starring = searchObj.makeArray(searchStarring);

        performSearch(searchObj, store.getAllMovies());
    }

    //filter all movies by (in this order:) year interval, ratings interval, genres, director and title

    function performSearch(find, all) {

        var searchResult = all.filter((val) => val.year >= find.year[0] && val.year <= find.year[1])
            .filter((val) => (val.averageRating >= find.rating[0] && val.averageRating <= find.rating[1]));

        if (find.hasOwnProperty("genre")) {
            searchResult = filterArray(find, searchResult, "genre");
        }

        if (find.hasOwnProperty("starring")) {
            searchResult = filterArray(find, searchResult, "starring");
        }

        if (find.hasOwnProperty("director")) {
            searchResult = searchString(find, searchResult, "director");
        }

        if (find.hasOwnProperty("title")) {
            searchResult = searchString(find, searchResult, "title");
        }

        store.refreshMovies(searchResult);
    }

    /* this is the function that took the longest time to figure out. It cross-filters two arrays and returns an element 
    (movie) only if it's present in the other (search). Had to make sure a result wasn't returned too early
    so I ended up with an indexOf-method in an if-statement inside a loop inside a filter method :) */
    function filterArray(find, all, prop) {
        return all.filter(function(val) {
            let add = false;
            for (var i in this[prop]) {
                //console.log("looking for " + this.starring[i] + " and currently looking at " + val.starring);
                if (val[prop].indexOf(this[prop][i]) > -1) {
                    add = true;
                }
            }
            return add;
        }, find);
    }

    function searchString(find, all, prop) {
        return all.filter(function(val, i) {
            return all[i][prop].toLowerCase() == find[prop].toLowerCase();
        });
    }

    return {
        makeSearchObject: makeSearchObject,
    };
})();



/*DATABASE. Module pattern. 
My existing movies are tucked away in storage here with no risk of manipulation once created.
The module is providing public endpoints to add a movie, get all movies, get some movies (filtered) and refreshing the list. 
Data is sent from here to...*/


var store = (function() {
    //This is the array where the movies are stored.
    var movieDatabase = [];
    return {
        addMovie: function(obj) {
            movieDatabase.push(obj);
        },

        /* I didn't come up with a way to add event listeners dynamically to ratings/edit genre buttons, so i simply added onclick calls 
        with the button element passed on. it's id number is the same as the ratings property id and the target movie's index. 
        Maybe not the most solid solution but it works :/ */
        addRating: function(button) {
            let id = parseInt(button.id.split("-")[1]);
            let rating = parseInt(document.getElementById("selectId-" + id).value);
            movieDatabase[id].rating.push(rating);
            movieDatabase[id].averageRating = movieDatabase[id].getAverageRating();
            return this.refreshMovies(this.getAllMovies());

        },
        editGenre: function(button) {
            let id = parseInt(button.id.split("-")[1]);
            let addGenre = Array.from(document.querySelectorAll(".edit-genre-" + id + ":checked")).map((val) => { return val.value; });
            movieDatabase[id].genre = addGenre;
            return this.refreshMovies(this.getAllMovies());

        },
        getAllMovies: function() {
            return movieDatabase;

        },
        getTopRatedMovie: function() {
            let allMovies = this.getAllMovies();
            let topRatedArr = [];
            topRatedArr.push(allMovies.reduce(function(prev, cur) {
                return prev.averageRating > cur.averageRating ? prev : cur;
            }));
            return topRatedArr;

        },
        getWorstRatedMovie: function() {
            let allMovies = this.getAllMovies();
            let lowRatedArr = [];
            lowRatedArr.push(allMovies.reduce(function(prev, cur) {
                return prev.averageRating < cur.averageRating ? prev : cur;
            }));
            return lowRatedArr;

        },
        refreshMovies: function(movies) {
            console.log(movies);
            return print.printMovies(movies);
        }
    };
})();

//3. PRINT-TO-SCREEN. Module pattern.
//Where all the object from storage are rendered. Only printing + display functions need to be public, other ones are internal

var print = (function() {

    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function storeLatestRender(moviesToPrint) {
        var latest = moviesToPrint;
    }

    function printGenres(arr) {
        let genreCode = "";
        for (let el in arr) {
            genreCode += `<div class="genre-box">${arr[el]}</div>`;
        }
        return genreCode;
    }

    function editGenre(movie) {
        let curGenre = movie.genre;
        let allGenres = ["Drama", "Romantic", "Comedy", "Thriller", "Action", "Horror", "Sci-fi", "Documentary", "Animated", "Kids"];
        genreBoxes = "";
        for (let all of allGenres) {
            let added = false;
            for (let has of curGenre) {
                if (all == has) {
                    genreBoxes += `<div class="genre"><input type="checkbox" class="edit-genre-${movie.id}" value="${all}" checked>${all}</div>`;
                    added = true;
                }
            }
            if (!added) genreBoxes += `<div class="genre"><input type="checkbox" class="edit-genre-${movie.id}" value="${all}">${all}</div>`;
        }
        return genreBoxes;
    }

    function toggleGenreBox(button) {
        console.log(event.target.id);
        let id = event.target.id.split("-")[1];
        let box = document.getElementById("edit-genre-box-" + id);
        console.log(box);
        box.classList.toggle("visible");
        box.classList.toggle("hidden");
    }

    function joinArray(val) {
        if (typeof val === "object") {
            return val.join(", ");
        }
        return val;
    }

    return {
        printMovies: function(movies) {
            var moviesToPrint = movies;
            var wrapper = document.getElementById("movie-wrapper");
            wrapper.innerHTML = "";
            if (moviesToPrint.length === 0) {
                wrapper.innerHTML = `<p id="no-result">Sorry, no result</p>`;
            } else {

                /* The movies are pushed into the array so that their id:s are the same as their index. 
                 I still want the latest movie displayed first though, that's why the array is printed out in reverse.*/
                for (let i = moviesToPrint.length - 1; i >= 0; i--) {
                    let movie = moviesToPrint[i];

                    //let filteredRating = movie.rating.filter((val) => val !== undefined); //kanske kan tas bort senare

                    wrapper.innerHTML += `
                <div class="moviebox">
                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
                <h4 class="title">${movie.title} <span class="tone-down">(${movie.year})</span></h4>
                <p>Director: <span class="credits tone-down">${movie.director}</span></p>
                <p>Starring: <span class="credits tone-down">${joinArray(movie.starring)}</span></p>
                <div>
                ${printGenres(movie.genre)}
                <a class="inline-link" id="openGenreBox-${movie.id}" onclick="print.toggleGenreBox(this)">&#10148; Edit genre</span></a>
                </div>
                <div class="hidden edit-genre-box" id="edit-genre-box-${movie.id}">${editGenre(movie)}
                <a id="sumbitNewGenreId-${movie.id}" class="inline-link" onclick="store.editGenre(this)">&#10148; Submit</button>
                </a>
                </div>          
                <div class="nobreak"><p>Rating: <span class="${setGradeColor(movie.averageRating)}">${movie.averageRating}</span>
                <span class="credits tone-down"> (${movie.rating.length} votes)</span>
                <a class="rateBtnClass inline-link" id="rateBtnId-${movie.id}" onclick="store.addRating(this)"> &#10148; Rate it!</a>
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
                </select></div>
                
                </p></div>

                `;
                }
            }
            storeLatestRender(moviesToPrint);
        },
        toggleBox: function(el) {
            let id = "add-movie-section";
            if (el == "toggleButton searchButton") {
                id = "search-movie-section";
            }
            let box = document.getElementById(id);
            box.classList.toggle("visible");
            box.classList.toggle("hidden");
        },
        getLastRender: storeLatestRender,
        toggleGenreBox: toggleGenreBox
    };
})();


//-----------------------------------------------//

//Sliders for advanced search. Only possible to get values, no input allowed.
//using noUISlider library - https://refreshless.com/nouislider/
//with wNumb number formatting library - https://refreshless.com/wnumb/
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