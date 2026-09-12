#pragma once
#include "Component.h"
#include <list>
//Component 클래스의 하위 클래스로 Composit 패턴을 이용한 Component 객체 들을 포함한다.
//이벤트의 처리 또한 담당한다.
class MouseListener;
class Container : public Component
{
public:
	Container();
	Container(string, int, int, int, int);

	bool eventHandler(ActionEvent) override;
	void repaint(HDC) override;

	void addMouseListener(MouseListener* l);
	virtual void addComponent(Component*);


protected:
	list<Component*> cpn;
	list<MouseListener*> mouseListener_;

	int shapeType;
	int checkBoxType;
	bool isChecked;
	bool isGroupKeyDown;
};

