export const protectRoute = (role) => {
    return (req, res, next) => {
        let failed = true;

        if (role === '*') {
            if (req.session.user?.id) {
                failed = false;
            }
        }

        if (role === 'admin') {
            if (req.session.user?.admin) {
                failed = false;
            }
        }

        if (failed) {
            req.session.return_url = req.originalUrl;
            res.redirect('/login');
        } else {
            next();
        }
    }
}