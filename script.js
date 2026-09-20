const API_KEY = "YOUR_API_KEY";

let videos = [];
let totalSeconds = 0;


// Get playlist ID from URL
function getPlaylistId(url) {
    try {
        let link = new URL(url);
        return link.searchParams.get("list");
    } catch {
        return null;
    }
}


// Main function
async function analyzePlaylist() {

    let url = document.getElementById("playlistUrl").value;
    let playlistId = getPlaylistId(url);
    let message = document.getElementById("message");

    if (!playlistId) {
        message.textContent = "Please enter a valid YouTube playlist URL.";
        return;
    }

    message.textContent = "Loading playlist...";

    try {

        // Get playlist name
        let playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`
        );

        let playlistData = await playlistResponse.json();

        if (!playlistData.items || playlistData.items.length === 0) {
            message.textContent = "Playlist not found.";
            return;
        }

        let title = playlistData.items[0].snippet.title;


        // Get videos
        let response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`
        );

        let data = await response.json();

        if (!data.items) {
            message.textContent = "Could not get playlist videos.";
            return;
        }

        let ids = data.items.map(
            item => item.snippet.resourceId.videoId
        );


        // Get video durations
        let videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(",")}&key=${API_KEY}`
        );

        let videoData = await videoResponse.json();

        videos = [];

        for (let i = 0; i < videoData.items.length; i++) {

            videos.push({
                title: data.items[i].snippet.title,
                seconds: convertDuration(
                    videoData.items[i].contentDetails.duration
                )
            });
        }


        totalSeconds = 0;

        videos.forEach(video => {
            totalSeconds += video.seconds;
        });


        // Show result
        document.getElementById("result").classList.remove("hidden");

        document.getElementById("playlistTitle").textContent = title;

        document.getElementById("videoCount").textContent =
            videos.length;

        document.getElementById("totalTime").textContent =
            formatTime(totalSeconds);

        document.getElementById("averageTime").textContent =
            formatTime(totalSeconds / videos.length);

        message.textContent = "";

        createPlan();

    } catch (error) {

        console.log(error);
        message.textContent =
            "Something went wrong. Check your API key.";
    }
}


// Convert YouTube duration to seconds
function convertDuration(duration) {

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    let h = duration.match(/(\d+)H/);
    let m = duration.match(/(\d+)M/);
    let s = duration.match(/(\d+)S/);

    if (h) hours = Number(h[1]);
    if (m) minutes = Number(m[1]);
    if (s) seconds = Number(s[1]);

    return hours * 3600 + minutes * 60 + seconds;
}


// Convert seconds into readable time
function formatTime(seconds) {

    seconds = Math.round(seconds);

    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return hours + "h " + minutes + "m";
    }

    return minutes + " min";
}


// Create study plan
function createPlan() {

    if (videos.length === 0) {
        return;
    }

    let hours = Number(document.getElementById("hours").value);
    let minutes = Number(document.getElementById("minutes").value);
    let speed = Number(document.getElementById("speed").value);

    let dailyMinutes = hours * 60 + minutes;

    if (dailyMinutes <= 0) {
        alert("Enter your daily study time.");
        return;
    }


    // Actual watch time after playback speed
    let remainingTime = totalSeconds / 60 / speed;

    let days = 0;
    let currentTime = 0;
    let currentVideos = 0;

    let plan = [];


    for (let video of videos) {

        let videoTime = video.seconds / 60 / speed;

        if (
            currentTime + videoTime > dailyMinutes &&
            currentVideos > 0
        ) {
            days++;

            plan.push({
                day: days,
                minutes: currentTime,
                videos: currentVideos
            });

            currentTime = 0;
            currentVideos = 0;
        }

        currentTime += videoTime;
        currentVideos++;
    }


    // Add last day
    if (currentVideos > 0) {

        days++;

        plan.push({
            day: days,
            minutes: currentTime,
            videos: currentVideos
        });
    }


    document.getElementById("daysNeeded").textContent = days;

    document.getElementById("videosPerDay").textContent =
        Math.ceil(videos.length / days);


    let date = new Date();

    date.setDate(date.getDate() + days - 1);

    document.getElementById("finishDate").textContent =
        date.toLocaleDateString();


    // Display plan
    let schedule = document.getElementById("schedule");

    schedule.innerHTML = "";

    plan.forEach(day => {

        let div = document.createElement("div");

        div.className = "day";

        div.innerHTML = `
            <h3>Day ${day.day}</h3>
            <p><b>${day.videos}</b> videos</p>
            <p>Watch time: ${formatTime(day.minutes * 60)}</p>
        `;

        schedule.appendChild(div);
    });


    // Speed comparison
    document.getElementById("normalTime").textContent =
        formatTime(totalSeconds);

    document.getElementById("fastTime").textContent =
        formatTime(remainingTime * 60);

    document.getElementById("currentSpeed").textContent =
        speed + "x";
}