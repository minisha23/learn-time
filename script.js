let videos = [];
let totalSeconds = 0;


// Get playlist ID from YouTube URL
function getPlaylistId(url) {

    try {
        let link = new URL(url);
        return link.searchParams.get("list");
    } catch (error) {
        return null;
    }
}


// Analyze playlist
async function analyzePlaylist() {

    let url = document.getElementById("playlistUrl").value.trim();
    let playlistId = getPlaylistId(url);
    let message = document.getElementById("message");

    if (!playlistId) {
        message.textContent =
            "Please enter a valid YouTube playlist URL.";
        return;
    }

    message.textContent = "Loading playlist...";

    try {

        // Call our Vercel backend
        let response =
            await fetch(`/api/youtube?playlistId=${playlistId}`);

        let data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || "Could not load playlist.";
            return;
        }

        // Store videos
        videos = data.videos.map(function(video) {

            return {
                title: video.title,
                seconds: convertDuration(video.duration)
            };

        });

        // Calculate total duration
        totalSeconds = 0;

        videos.forEach(function(video) {
            totalSeconds += video.seconds;
        });


        // Show result section
        document
            .getElementById("result")
            .classList.remove("hidden");


        // Playlist title
        document.getElementById("playlistTitle").textContent =
            data.title;


        // Number of videos
        document.getElementById("videoCount").textContent =
            videos.length;


        // Total duration
        document.getElementById("totalTime").textContent =
            formatTime(totalSeconds);


        // Average duration
        if (videos.length > 0) {

            document.getElementById("averageTime").textContent =
                formatTime(totalSeconds / videos.length);

        } else {

            document.getElementById("averageTime").textContent =
                "0 min";
        }


        message.textContent = "";

        // Create study plan
        createPlan();

    } catch (error) {

        console.log(error);

        message.textContent =
            "Something went wrong. Please try again.";
    }
}



// Convert YouTube ISO duration to seconds
function convertDuration(duration) {

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    let hourMatch = duration.match(/(\d+)H/);
    let minuteMatch = duration.match(/(\d+)M/);
    let secondMatch = duration.match(/(\d+)S/);

    if (hourMatch) {
        hours = parseInt(hourMatch[1]);
    }

    if (minuteMatch) {
        minutes = parseInt(minuteMatch[1]);
    }

    if (secondMatch) {
        seconds = parseInt(secondMatch[1]);
    }

    return (hours * 3600) +
           (minutes * 60) +
           seconds;
}



// Convert seconds into readable time
function formatTime(seconds) {

    seconds = Math.round(seconds);

    let hours = Math.floor(seconds / 3600);

    let minutes =
        Math.floor((seconds % 3600) / 60);

    if (hours > 0) {

        return hours + "h " +
               minutes + "m";

    }

    return minutes + " min";
}



// Create personalized study plan
function createPlan() {

    if (videos.length === 0) {
        return;
    }


    let hours =
        parseInt(document.getElementById("hours").value) || 0;

    let minutes =
        parseInt(document.getElementById("minutes").value) || 0;

    let speed =
        parseFloat(document.getElementById("speed").value) || 1;


    // Daily available study time
    let dailyMinutes =
        (hours * 60) + minutes;


    if (dailyMinutes <= 0) {

        document.getElementById("daysNeeded").textContent = "-";
        document.getElementById("videosPerDay").textContent = "-";
        document.getElementById("finishDate").textContent = "-";

        document.getElementById("schedule").innerHTML =
            "<p>Please enter your daily study time.</p>";

        return;
    }


    // Convert daily time into seconds
    let dailySeconds =
        dailyMinutes * 60;


    // Create days
    let days = [];
    let currentDay = [];
    let currentTime = 0;


    videos.forEach(function(video) {

        // Actual watch time at selected speed
        let watchTime =
            video.seconds / speed;


        /*
         If adding this video crosses the daily limit,
         start a new day.
        */
        if (
            currentTime + watchTime > dailySeconds &&
            currentDay.length > 0
        ) {

            days.push({
                videos: currentDay,
                seconds: currentTime
            });

            currentDay = [];
            currentTime = 0;
        }


        currentDay.push(video);
        currentTime += watchTime;

    });


    // Add last day
    if (currentDay.length > 0) {

        days.push({
            videos: currentDay,
            seconds: currentTime
        });

    }


    // Number of days
    document.getElementById("daysNeeded").textContent =
        days.length;


    // Average videos per day
    let averageVideos =
        Math.ceil(videos.length / days.length);

    document.getElementById("videosPerDay").textContent =
        averageVideos;


    // Calculate finish date
    let finishDate = new Date();

    finishDate.setDate(
        finishDate.getDate() + days.length - 1
    );


    let dateText =
        finishDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });


    document.getElementById("finishDate").textContent =
        dateText;


    // Display daily schedule
    let schedule =
        document.getElementById("schedule");

    schedule.innerHTML = "";


    days.forEach(function(day, index) {

        let dayBox =
            document.createElement("div");

        dayBox.className = "day";


        let title =
            document.createElement("h3");

        title.textContent =
            "Day " + (index + 1);


        let videoText =
            document.createElement("p");

        videoText.innerHTML =
            "<b>" +
            day.videos.length +
            "</b> videos";


        let timeText =
            document.createElement("p");

        timeText.textContent =
            "Watch time: " +
            formatTime(day.seconds);


        dayBox.appendChild(title);
        dayBox.appendChild(videoText);
        dayBox.appendChild(timeText);


        schedule.appendChild(dayBox);

    });


    // Update speed comparison
    updateSpeedComparison(speed);
}



// Compare different playback speeds
function updateSpeedComparison(speed) {

    let normalTime =
        formatTime(totalSeconds);

    let fastTime =
        formatTime(totalSeconds / speed);


    document.getElementById("normalTime").textContent =
        normalTime;


    document.getElementById("currentSpeed").textContent =
        speed + "x";


    document.getElementById("fastTime").textContent =
        fastTime;
}



// Create plan whenever settings change
document
    .getElementById("hours")
    .addEventListener("input", createPlan);

document
    .getElementById("minutes")
    .addEventListener("input", createPlan);

document
    .getElementById("speed")
    .addEventListener("change", createPlan);