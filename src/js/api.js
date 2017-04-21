var api = (function() {
    //var server = "https://jmdb.herokuapp.com/movies";
    var server = "https://jmdb.azurewebsites.net/movies";

    //backup
    //server = "https://api.myjson.com/bins/10h80z";

    return {
        /**
         * GETs all movies from the API
         * sometimes gets a querystring for search, otherwise just gets all
         */
        getMovies: function(query) {
            let thisUrl = server;
            if (query) thisUrl += query;

            $.getJSON({
                url: thisUrl,
                beforeSend: () => { print.showSpinner(); },
                success: (fetchedMovies) => {
                    console.log("fetched from: ", thisUrl, fetchedMovies);
                    store.storeMovies(fetchedMovies);
                },
                complete: () => { print.hideSpinner(); },
                error: (error) => {
                    alert("There was a problem with loading the movies: ", error);
                }
            });
        },

        postMovie: function(movie) {
            $.ajax({
                method: "POST",
                url: server,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(movie),
                beforeSend: () => { print.showSpinner(); },
                success: (response) => {
                    console.log("successfully posted:", response);
                    //fetching all movies once again
                    api.getMovies();
                },
                complete: () => { print.hideSpinner(); },
                error: (error) => {
                    alert("Oh no, there was an error posting your movie:", error);
                }
            });
        },

        patchMovie: function(id, patchObj) {
            $.ajax({
                method: "PATCH",
                url: server + "/" + id,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(patchObj),
                beforeSend: () => { print.showSpinner(); },
                success: (response) => {
                    console.log("successfully patched:", response);
                    //fetching all movies once again
                    api.getMovies();
                },
                complete: () => { print.hideSpinner(); },
                error: (error) => {
                    alert("Oh no, there was an error patching your movie:", error);
                }
            });

        },

        deleteMovie: function(id) {
            $.ajax({
                method: "DELETE",
                url: server + "/" + id,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                beforeSend: () => { print.showSpinner(); },
                success: () => {
                    console.log("successfully deleted:");
                    //fetching all movies once again
                    api.getMovies();
                },
                complete: () => { print.hideSpinner(); },
                error: (error) => {
                    alert("Oh no, there was an error deleting the movie:", error);
                }
            });
        }
    };
})();