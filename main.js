//My database of existing movies, tucked away in a module so values are not changed
var movieModule = (function() {
    var movieDatabase = [{
        title: "Silence Of The Lambs",
        year: 1991,
        director: "Jonathan Demme",
        starring: "Jodie Foster, Anthony Hopkins",
        genre: ["Horror", "Thriller"],
        cover: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg",
        rating: [5]
    }];
    return {
        addMovie: function(obj) {
            console.log(obj);
            movieDatabase.push(obj);

        },
        returnMovieDatabase: function() {
            return movieDatabase;
        }
    };
})();


//event handlers
window.addEventListener("DOMContentLoaded", printMovies);


//Functions that handle printouts
function printMovies() {
    var movies = movieModule.returnMovieDatabase();
    var target = document.getElementById("target");
    for (var movie of movies) {
        var filteredRating = movie.rating.filter(function(val) { return val !== undefined; });
        target.innerHTML += `<div class="moviebox">
                                <img src="${movie.cover}" alt="${movie.title}"/>
                                <p class="title">${movie.title} (${movie.year})</p>
                                <p class="credits">Director: ${movie.director}</p>
                                <p class="credits">Starring: ${movie.starring}</p>
                                <p class="genres">Genre: ${movie.genre.join(' ')}</p>
                                <p class="rating">Rating: ${movie.rating} (${filteredRating.length} votes)</p>

                            </div>
        `

    }


}



//My movies-constructor for making new movie-objects
function Movie(title, year = "n/a", director = "n/a", starring = "n/a", genre = "n/a", cover = "images/nocover.jpg", rating) {
    this.title = title;
    this.year = year;
    this.director = director;
    this.starring = [starring];
    this.genre = [genre];
    this.cover = cover;
    this.rating = [rating];
}

var jurassicPark = new Movie("Jurassic Park", 1994, "Cameron");
movieModule.addMovie(jurassicPark);