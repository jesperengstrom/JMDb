//event handlers
window.addEventListener("DOMContentLoaded", () => print.printMovies(store.getAllMovies()));
document.getElementById("add-submit").addEventListener("click", () => {

    let movieTitle = document.getElementById("add-title").value;
    let movieRating = parseInt(document.getElementById("add-rating").value);
    let movieYear = parseInt(document.getElementById("add-year").value);
    let movieGenre = Array.from(document.querySelectorAll(".add-genre:checked")).map((val) => { return val.value; });
    let movieCover = document.getElementById("add-cover").value;
    let movieDirector = document.getElementById("add-director").value;
    let movieStarring = document.getElementById("add-starring").value;

    input.makeObject(movieTitle, movieRating, movieYear, movieGenre, movieCover, movieDirector, movieStarring, true);
});
document.getElementById("search-submit").addEventListener("click", () => {

    let searchTitle = document.getElementById("search-title").value;
    let ratingInterval = ratingSlider.noUiSlider.get();
    let yearInterval = yearSlider.noUiSlider.get();
    let filterGenre = Array.from(document.querySelectorAll(".filter-genre:checked")).map((val) => { return val.value; });
    let searchCover = "";
    let searchDirector = document.getElementById("search-director").value;
    let searchStarring = document.getElementById("search-starring").value;

    input.makeObject(searchTitle, ratingInterval, yearInterval, filterGenre, searchCover, searchDirector, searchStarring, false);
});

Array.from(document.getElementsByClassName("toggleVisible")).forEach((el) => {
    el.addEventListener("click", () => {
        print.toggleBox();
    });
});

/*I basically have three modules that handle all functionality, for grouping and privacy puropses: 
as much as possible of their variables and functions are private, they have a public API with functions necessary to communicate with each other.

1. INPUT. Revealing module pattern. All form input (both add and search) are modified and made into objects using a CONSTRUCTOR
inside the module. It is then passed on to... */

var input = (function() {
    function Movie(title, rating, year, genre, cover = "images/nocover.jpg", director = "N/A", starring = "N/A", isAdd) {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
        this.isAdd = isAdd;
    }

    Movie.prototype.makeArray = function(string) {
        return string.split(", ");
    };

    Movie.prototype.addOrSearch = function() {
        if (this.isAdd) {
            store.addMovie(this);
            print.toggleBox();
            document.getElementById("add-movie-form").reset();
        } else { console.log(this); }
    };

    function makeObject(title, rating, year, genre, cover, director, starring, isAdd) {
        var newMovie = new Movie();
        if (title.length !== 0) newMovie.title = title;
        if (rating.length !== 0) newMovie.rating = [rating];
        if (year.length !== 0) newMovie.year = year;
        if (genre.length !== 0) newMovie.genre = genre;
        if (cover.length !== 0) newMovie.cover = cover;
        if (director.length !== 0) newMovie.director = director;
        if (starring.length !== 0) newMovie.starring = newMovie.makeArray(starring);
        newMovie.isAdd = isAdd;
        newMovie.addOrSearch();
    }

    return {
        makeObject: makeObject,
        Movie: Movie
    };
})();


/*2. DATABASE. Module pattern. 
My existing movies are tucked away in storage here with no risk of manipulation once created.
The module is providing public endpoints to add a movie, get all movies, get some movies (filtered) and refreshing the list. 
Data is sent from here to...*/

var store = (function() {
    var movieDatabase = [{
        title: "Silence Of The Lambs",
        rating: [7, 8, 9, 6],
        year: 1991,
        director: "Jonathan Demme",
        starring: ["Jodie Foster", "Anthony Hopkins"],
        genre: ["Horror", "Thriller"],
        cover: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg"
    }, ];
    return {
        addMovie: function(obj) {
            movieDatabase.unshift(obj);
            return this.refreshMovies(this.getAllMovies());
        },
        getAllMovies: function() {
            return movieDatabase;
        },
        refreshMovies: function(movies) {
            console.log(movieDatabase);
            return print.printMovies(movies);
        }
    };
})();

//3. PRINT-TO-SCREEN. Module pattern.
//Where all the object from storage are rendered. Only printing + display functions need to be public, other ones are internal

var print = (function() {

    function calcRating(arr) {
        let rating = (arr.reduce((prev, cur) => prev + cur) / arr.length).toFixed(1);
        return rating;
    }

    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function printGenres(arr) {
        let genreCode = "";
        for (let el in arr) {
            genreCode += `<div class="genre-box">${arr[el]}</div>`;
        }
        genreCode += `<span class="inline-link"><a href="#">Edit genre</a></span>`;
        return genreCode;
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
            for (let movie of moviesToPrint) {
                //let filteredRating = movie.rating.filter((val) => val !== undefined); //kanske kan tas bort senare

                wrapper.innerHTML += `<div class="moviebox">
                                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
                                <h4 class="title">${movie.title} <span class="tone-down">(${movie.year})</span></h4>
                                <p class="credits tone-down">Director: ${movie.director}</p>
                                <p class="credits tone-down">Starring: ${joinArray(movie.starring)}</p>
                                ${printGenres(movie.genre)}
                                <p class="credits tone-down">Rating: <span class="${setGradeColor(calcRating(movie.rating))}">${calcRating(movie.rating)}</span> (${movie.rating.length} votes)</p></div>`;
            }
        },
        toggleBox: function() {
            let addBox = document.getElementById("add-movie-section");
            addBox.classList.toggle("visible");
            addBox.classList.toggle("hidden");
        }
    };
})();



//pre-defined movie objects initializing the constructor.
store.addMovie(new input.Movie("Jurassic Park", 7, 1993, ["Action", "Thriller", "Sci-fi"], "https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg", "Steven Spielberg", ["Sam Neill", "Laura Dern"]));



//-----------------------------------------------//

//Sliders for advanced search. Only possible to get values, no input.
//using noUISlider library - https://refreshless.com/nouislider/
//with wNumb number formatting library for comfort - https://refreshless.com/wnumb/
//They use the factory pattern, so I make two of my own sliders using Object.create() and some customizing.

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