//MODULE PATTERN
//My database of existing movies, tucked away in a module so data is safe
//providing public "endpoints" to get all movies, get some movies (filted) and addding a movie.

var movieModule = (function() {
    var movieDatabase = [{
        title: "Silence Of The Lambs",
        rating: [7, 8, 9, 6],
        year: 1991,
        director: "Jonathan Demme",
        starring: ["Jodie Foster", "Anthony Hopkins"],
        genre: ["Horror", "Thriller"],
        cover: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg"

    }];
    return {
        addMovie: function(obj) {
            movieDatabase.push(obj);
            return this.refreshMovies(this.getAllMovies());
        },
        getAllMovies: function() {
            return movieDatabase;
        },
        refreshMovies: function(movies) {
            console.log(movieDatabase);
            return printMovies(movies);

        }
    };
})();


//event handlers
window.addEventListener("DOMContentLoaded", () => printMovies(movieModule.getAllMovies()));
document.getElementById("add-submit").addEventListener("click", createMovie);


//Functions that handle screen printout
function printMovies(movies) {
    var moviesToPrint = movies;
    var wrapper = document.getElementById("movie-wrapper");
    wrapper.innerHTML = "";
    for (let movie of moviesToPrint) {

        let filteredRating = movie.rating.filter((val) => val !== undefined); //kanske kan tas bort senare

        if (typeof movie.starring !== 'string') {
            movie.starring.join(", ");
        }


        wrapper.innerHTML += `<div class="moviebox">
                                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
                                <h4 class="title">${movie.title} <span class="year">(${movie.year})</span></h4>
                                <p class="credits">Director: ${movie.director}</p>
                                <p class="credits">Starring: ${movie.starring}</p>
                                <p class="genres">Genre: ${movie.genre.join(" ")}
                                <span class="inline-link"><a href="#">Edit</a></span></p>
                                <p class="rating">Rating: ${calcRating(movie.rating)} (${filteredRating.length} votes)</p>

                            </div>`
    }
}

//pure utility functions
function calcRating(arr) {
    let rating = (arr.reduce((prev, cur) => prev + cur) / arr.length).toFixed(1);
    return rating;
}


//CONSTRUCTOR PATTERN
//My movies-constructor for making new movie-objects
function Movie(title, rating, year = "n/a", director = "n/a", starring = "n/a", genre = "none", cover = "images/nocover.jpg") {
    this.title = title;
    this.rating = [rating];
    this.year = year;
    this.director = director;
    this.starring = starring;
    this.genre = genre;
    this.cover = cover;
}

function createMovie() {
    let movieTitle = document.getElementById("add-title").value;
    let movieRating = document.getElementById("add-rating").value;
    let movieYear = document.getElementById("add-year").value;
    let movieDirector = document.getElementById("add-director").value;
    let movieStarring = document.getElementById("add-starring").value;
    let movieGenre = Array.from(document.querySelectorAll(".add-genre:checked")).map((val) => { return val.value; });
    let movieCover = document.getElementById("add-cover").value;
    console.log(movieCover);
    let newMovie = new Movie(movieTitle, movieRating, movieYear, movieDirector, movieStarring, movieGenre, movieCover);
    movieModule.addMovie(newMovie);
    document.getElementById("add-movie-form").reset();


}

var jurassicPark = new Movie("Jurassic Park", [5], 1993, "Steven Spielberg", ["Sam Neill", "Laura Dern"], ["Action", "Thriller", "Sci-fi"], "https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg");
movieModule.addMovie(jurassicPark);