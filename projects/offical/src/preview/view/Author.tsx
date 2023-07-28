import {Badge, Card, Typography, Row, Col, Avatar} from 'antd'
import {users} from 'src/preview/config'
const AuthorItem = ({user}: any) => (
  <div className="author">
    <Card hoverable>
      <a href={user.link} target="_blank" rel="noreferrer">
        <img className="avatar" src={user.avatar} />
        <h2 className="title">{user.name}</h2>
        <p className="description">{user.description}</p>
        {/* <Card.Meta
          className="metaList"
          avatar={<Avatar size="large" shape="circle" src={user.avatar} />}
          title={user.name}
          description={user.description}
        /> */}
      </a>
    </Card>
  </div>
)
const Author = () => (
  <Row wrap={true} gutter={[16, 16]}>
    {users.map(user => (
      <Col key={user.name} span={4} xs={8} sm={6} md={4} lg={3}>
        <AuthorItem user={user} />
      </Col>
    ))}
  </Row>
)
export default Author
