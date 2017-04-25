var api = (function() {
    //var server = "https://jmdb.herokuapp.com/movies";
    //backup
    //server = "https://api.myjson.com/bins/10h80z";
    var server = "https://jmdb.azurewebsites.net/movies";
    var latestQuery = "";

    return {
        prepareURL: function(string) {
            let url = server;
            if (string) url += string;
            api.getMovies(url);
        },

        /**
         * GETs all movies from the API
         * sometimes gets a querystring for search, otherwise just gets all
         */
        getMovies: function(url) {
            latestQuery = url;

            $.getJSON({
                url: url,
                beforeSend: () => { print.showSpinner(); },
                success: (fetchedMovies) => {
                    console.log("fetched from: ", url);
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
                    api.prepareURL();
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
                    api.getMovies(latestQuery);
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
                    console.log("successfully deleted movie id ", id);
                    //fetching all movies once again
                    api.prepareURL();
                },
                complete: () => { print.hideSpinner(); },
                error: (error) => {
                    alert("Oh no, there was an error deleting the movie:", error);
                }
            });
        }
    };
})();