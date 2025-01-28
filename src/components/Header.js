function Header(props) {
    return (
        <div >

            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <h2 className="hello" >StudMoni</h2>
                <img className="profile" src="https://www.pngkit.com/png/detail/18-185796_icon-png-student-icon-png.png"
                    alt="student-icon"
                    style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        objectFit: "cover"
                    }}
                />
            </div>

            <h1 className="wish"> Hi, {props.data}</h1>
            <div className="line"></div>
        </div>
    )
}
export default Header;