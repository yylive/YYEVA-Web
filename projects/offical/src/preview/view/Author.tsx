import {Badge, Card, Typography, Row, Col, Avatar} from 'antd'
import {users} from 'src/preview/config'
const AuthorItem = ({user}: any) => (
  <div className="authorAvatar">
    <Card hoverable>
      <a href={user.link} target="_blank" rel="noreferrer">
        <Card.Meta
          avatar={<Avatar size="large" shape="circle" src={user.avatar} />}
          title={user.name}
          description={user.description}
        />
      </a>
    </Card>
  </div>
)
const Author = () => (
  <Row wrap={true} gutter={[16, 16]}>
    {users.map(user => (
      <Col key={user.name} span={6}>
        <AuthorItem user={user} />
      </Col>
    ))}
  </Row>
)
export default Author
