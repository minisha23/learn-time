export default async function handler(req, res) {

    const playlistId = req.query.playlistId;

    if (!playlistId) {
        return res.status(400).json({
            error: "Playlist ID is required"
        });
    }

    const key = process.env.YOUTUBE_API_KEY;

    if (!key) {
        return res.status(500).json({
            error: "YouTube API key not found"
        });
    }

    try {

        // Get playlist details
        const playlistUrl =
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${key}`;

        const playlistResponse = await fetch(playlistUrl);
        const playlistData = await playlistResponse.json();

        if (playlistData.error) {
            return res.status(400).json({
                error: playlistData.error.message
            });
        }

        if (!playlistData.items || playlistData.items.length === 0) {
            return res.status(404).json({
                error: "Playlist not found"
            });
        }


        // Get playlist videos
        let items = [];
        let nextPageToken = "";

        do {

            let videosUrl =
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${key}`;

            if (nextPageToken) {
                videosUrl += `&pageToken=${nextPageToken}`;
            }

            const videosResponse =
                await fetch(videosUrl);

            const videosData =
                await videosResponse.json();

            if (videosData.error) {
                return res.status(400).json({
                    error: videosData.error.message
                });
            }

            items = items.concat(videosData.items || []);

            nextPageToken =
                videosData.nextPageToken || "";

        } while (nextPageToken);


        // Get video IDs
        const videoIds = items
            .map(item => item.snippet?.resourceId?.videoId)
            .filter(Boolean);


        let videos = [];


        // YouTube allows maximum 50 IDs per request
        for (let i = 0; i < videoIds.length; i += 50) {

            const batch =
                videoIds.slice(i, i + 50);


            const durationUrl =
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${key}`;


            const durationResponse =
                await fetch(durationUrl);

            const durationData =
                await durationResponse.json();


            if (durationData.error) {
                return res.status(400).json({
                    error: durationData.error.message
                });
            }


            const durationMap = new Map();


            (durationData.items || []).forEach(video => {

                durationMap.set(
                    video.id,
                    video.contentDetails.duration
                );

            });


            batch.forEach(videoId => {

                const item = items.find(
                    item =>
                        item.snippet?.resourceId?.videoId === videoId
                );


                if (item && durationMap.has(videoId)) {

                    videos.push({
                        title: item.snippet.title,
                        duration: durationMap.get(videoId)
                    });

                }

            });

        }


        // Send playlist + videos to frontend
        return res.status(200).json({

            title:
                playlistData.items[0].snippet.title,

            videos: videos

        });


    } catch (error) {

        console.log("YouTube API error:", error);

        return res.status(500).json({
            error: error.message || "Something went wrong"
        });

    }

}