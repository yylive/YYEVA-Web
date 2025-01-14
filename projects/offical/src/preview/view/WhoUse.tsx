import {Avatar, Badge, Card, Col, Row, Typography} from 'antd'
import {brands} from 'src/preview/config'
const List = ({brand}: any) => {
  return (
    <Card hoverable>
      <div className="brand">
        <img src={brand.img} />
        <h2>{brand.name}</h2>
      </div>
    </Card>
  )
}
const WhoUse = () => (
  <Row wrap={true} gutter={[16, 16]}>
    {brands.map(brand => (
      <Col key={brand.name} span={4} xs={8} sm={6} md={4} lg={3}>
        <List brand={brand} />
      </Col>
    ))}
  </Row>
)
export default WhoUse
