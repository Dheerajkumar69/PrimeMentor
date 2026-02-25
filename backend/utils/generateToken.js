import jwt from 'jsonwebtoken'

const generateToken = (id) => {
    // 8 h — short enough to limit damage from a stolen token, long enough for a
    // full admin working session. The admin re-authenticates the next day.
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:'8h'
    })
}

export default generateToken