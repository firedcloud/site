#[test]
fn flex_grow_within_constrained_max_width() {
    let mut stretch = stretch::Stretch::new();
    let node00 = stretch
        .new_node(
            stretch::style::Style {
                flex_grow: 1f32,
                size: stretch::geometry::Size {
                    height: stretch::style::Dimension::Points(20f32),
                    ..Default::default()
                },
                ..Default::default()
            },
            &[],
        )
        .unwrap();
    let node0 = stretch
        .new_node(
            stretch::style::Style {
                max_size: stretch::geometry::Size {
                    width: stretch::style::Dimension::Points(300f32),
                    ..Default::default()
                },
                ..Default::default()
            },
            &[node00],
        )
        .unwrap();
    let node = stretch
        .new_node(
            stretch::style::Style {
                flex_direction: stretch::style::FlexDirection::Column,
                size: stretch::geometry::Size {
                    width: stretch::style::Dimension::Points(200f32),
                    height: stretch::style::Dimension::Points(100f32),
                    ..Default::default()
                },
                ..Default::default()
            },
            &[node0],
        )
        .unwrap();
    stretch.compute_layout(node, stretch::geometry::Size::undefined()).unwrap();
    assert_eq!(stretch.layout(node).unwrap().size.width, 200f32);
    assert_eq!(stretch.layout(node).unwrap().size.height, 100f32);
    assert_eq!(stretch.layout(node).unwrap().location.x, 0f32);
    assert_eq!(stretch.layout(node).unwrap().location.y, 0f32);
    assert_eq!(stretch.layout(node0).unwrap().size.width, 200f32);
    assert_eq!(stretch.layout(node0).unwrap().size.height, 20f32);
    assert_eq!(stretch.layout(node0).unwrap().location.x, 0f32);
    assert_eq!(stretch.layout(node0).unwrap().location.y, 0f32);
    assert_eq!(stretch.layout(node00).unwrap().size.width, 200f32);
    assert_eq!(stretch.layout(node00).unwrap().size.height, 20f32);
    assert_eq!(stretch.layout(node00).unwrap().location.x, 0f32);
    assert_eq!(stretch.layout(node00).unwrap().location.y, 0f32);
}