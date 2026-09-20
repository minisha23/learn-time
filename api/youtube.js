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
        const url =
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            return res.status(404).json({
                error: "Playlist not found"
            });
        }

        return res.status(200).json({
            message: "API is working!",
            title: data.items[0].snippet.title
        });

    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong"
        });
    }
}